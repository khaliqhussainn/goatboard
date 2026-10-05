import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getRants } from "@/lib/queries/rants";
import { RANT_CATEGORIES } from "@/lib/rants";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";

const rantSchema = z.object({
  body: z.string().trim().min(12, "Tell us a little more about the problem.").max(180),
  category: z.enum(RANT_CATEGORIES),
});

export async function GET() {
  try {
    const visitorId = await getVisitorId();
    return NextResponse.json({ rants: await getRants(visitorId) });
  } catch (error) {
    console.error("rant board read failed", error);
    return NextResponse.json({ message: "Couldn't load the Rant Board." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const visitorLimit = rateLimit(`rant-post:${visitorId}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  const ipLimit = rateLimit(`rant-post-ip:${getClientIp(request.headers)}`, { limit: 12, windowMs: 60 * 60 * 1000 });
  if (!visitorLimit.success || !ipLimit.success) {
    return NextResponse.json({ message: "You're posting too quickly. Try again later." }, { status: 429 });
  }

  const parsed = rantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid rant." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("rants")
      .insert({ author_id: visitorId, body: parsed.data.body, category: parsed.data.category })
      .select("id, body, category, same_count, reply_count, created_at")
      .single();

    if (error || !data) {
      console.error("rant insert failed", error);
      return NextResponse.json({ message: "Couldn't post your rant." }, { status: 500 });
    }

    const { error: reactionError } = await admin
      .from("rant_same_reactions")
      .insert({ rant_id: data.id, visitor_id: visitorId });
    if (reactionError) console.error("opening SAME reaction failed", reactionError);

    return NextResponse.json(
      {
        rant: {
          id: data.id,
          body: data.body,
          category: data.category,
          sameCount: reactionError ? data.same_count : data.same_count + 1,
          replies: data.reply_count,
          didSame: !reactionError,
          products: [],
          createdAt: data.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) console.error(error.message);
    else console.error("rant creation crashed", error);
    return NextResponse.json({ message: "Couldn't post your rant." }, { status: 500 });
  }
}
