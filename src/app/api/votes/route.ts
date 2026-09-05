import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const voteSchema = z.object({ campaignId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "unauthenticated" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`vote:${user.id}:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ success: false, message: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "invalid_input" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("cast_vote", {
    p_campaign_id: parsed.data.campaignId,
    p_voter_id: user.id,
  });

  if (error) {
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
}
