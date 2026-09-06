import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const voteSchema = z.object({ campaignId: z.string().uuid() });

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ success: false, message: "no_visitor_id" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`vote:${visitorId}:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ success: false, message: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "invalid_input" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("cast_vote", {
      p_campaign_id: parsed.data.campaignId,
      p_voter_id: visitorId,
    });

    if (error) {
      console.error("cast_vote failed", error);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }

    const result = data?.[0];
    if (!result?.success) {
      const status = result?.message === "campaign_not_found" ? 404 : 200;
      return NextResponse.json(
        { success: false, message: result?.message ?? "vote_failed" },
        { status },
      );
    }

    return NextResponse.json({ success: true, totalPower: result.total_power });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }
    console.error("vote crashed", error);
    return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
  }
}
