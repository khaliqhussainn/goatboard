import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { commentSchema } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Posts a comment on a campaign.
 *
 * The author is the visitor cookie, stamped here rather than accepted from
 * the body - the same anonymous identity that limits voting. Writes go
 * through the service role because campaign_comments has no client insert
 * policy, which is what keeps this the only way in.
 */
export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`comment:${visitorId}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json(
      { message: "You're commenting too fast. Give it a minute." },
      { status: 429 },
    );
  }
  const ipLimit = rateLimit(`comment-ip:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();

    // Only active campaigns take comments - a suspended or removed one
    // shouldn't collect new ones while it's hidden.
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id, created_by")
      .eq("id", parsed.data.campaignId)
      .eq("status", "active")
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
    }

    // A founder who skipped the field on the create form and wrote their
    // opening comment here instead still gets the heading - otherwise whether
    // it appears depends on which box they happened to type into. Only the
    // first one, and only from the campaign's own creator, so the label can
    // never be claimed by a visitor or repeated down the thread.
    let isFounder = false;
    if (campaign.created_by === visitorId) {
      const { count } = await admin
        .from("campaign_comments")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", parsed.data.campaignId)
        .eq("is_founder", true);
      isFounder = (count ?? 0) === 0;
    }

    const { data, error } = await admin
      .from("campaign_comments")
      .insert({
        campaign_id: parsed.data.campaignId,
        author_id: visitorId,
        author_name: parsed.data.authorName,
        body: parsed.data.body,
        is_founder: isFounder,
      })
      .select("id, campaign_id, body, created_at, author_id, author_name, is_founder")
      .single();

    if (error || !data) {
      console.error("comment insert failed", error);
      return NextResponse.json({ message: "Couldn't post your comment." }, { status: 500 });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("comment creation crashed", error);
    return NextResponse.json({ message: "Couldn't post your comment." }, { status: 500 });
  }
}
