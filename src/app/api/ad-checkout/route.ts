import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { createAdSlotCheckout } from "@/lib/lemonsqueezy";
import { adCheckoutSchema, AD_SLOT_PRICING } from "@/lib/validation";
import { getSiteUrl } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`ad-checkout:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: adSlot } = await admin
    .from("ad_slots")
    .select("id, name, duration_days, status")
    .eq("id", parsed.data.adSlotId)
    .single();

  if (!adSlot || adSlot.status !== "pending") {
    return NextResponse.json({ message: "Ad not found." }, { status: 404 });
  }

  const siteUrl = getSiteUrl(new URL(request.url).origin);
  const amount = AD_SLOT_PRICING[adSlot.duration_days as keyof typeof AD_SLOT_PRICING];

  try {
    const url = await createAdSlotCheckout({
      adSlotId: adSlot.id,
      adSlotName: adSlot.name,
      amountUsd: amount,
      durationDays: adSlot.duration_days,
      redirectUrl: `${siteUrl}/?ad_purchased=${adSlot.duration_days}`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
    } else {
      console.error("ad checkout failed", error);
    }
    return NextResponse.json(
      { message: "Renting the ad slot isn't available right now. Try again shortly." },
      { status: 502 },
    );
  }
}
