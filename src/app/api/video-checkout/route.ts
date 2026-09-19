import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { createVideoAdCheckout } from "@/lib/lemonsqueezy";
import { videoCheckoutSchema } from "@/lib/validation";
import { getSiteUrl } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`video-checkout:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = videoCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: videoAd } = await admin
    .from("video_ads")
    .select("id, name, status")
    .eq("id", parsed.data.videoAdId)
    .single();

  if (!videoAd || videoAd.status !== "pending") {
    return NextResponse.json({ message: "Ad not found." }, { status: 404 });
  }

  const siteUrl = getSiteUrl(new URL(request.url).origin);

  try {
    // No price is sent: the video ad is a single fixed-price Lemon Squeezy
    // variant, so the variant decides what gets charged.
    const { url } = await createVideoAdCheckout({
      videoAdId: videoAd.id,
      videoAdName: videoAd.name,
      redirectUrl: `${siteUrl}/?video_ad_purchased=1`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
    } else {
      console.error("video ad checkout failed", error);
    }
    return NextResponse.json(
      { message: "Renting the video spot isn't available right now. Try again shortly." },
      { status: 502 },
    );
  }
}
