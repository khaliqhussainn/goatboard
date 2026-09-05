import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`report:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many reports. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    campaign_id: parsed.data.campaignId,
    reason: parsed.data.reason,
  });

  if (error) {
    return NextResponse.json({ message: "Couldn't file report." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
