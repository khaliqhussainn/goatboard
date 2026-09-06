import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/lemonsqueezy";
import { boostSchema, POWER_PER_DOLLAR } from "@/lib/validation";
import { getSiteUrl } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`checkout:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = boostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, name, status")
    .eq("id", parsed.data.campaignId)
    .single();

  if (!campaign || campaign.status !== "active") {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const siteUrl = getSiteUrl(new URL(request.url).origin);
  const power = parsed.data.amount * POWER_PER_DOLLAR;

  try {
    const url = await createCheckout({
      campaignId: campaign.id,
      campaignName: campaign.name,
      amountUsd: parsed.data.amount,
      power,
      redirectUrl: `${siteUrl}/campaign/${campaign.slug}?boosted=${power}`,
    });

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { message: "Boosting isn't available right now. Try again shortly." },
      { status: 502 },
    );
  }
}
