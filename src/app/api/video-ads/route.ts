import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { videoAdSchema, VIDEO_AD_PRICE_USD } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`create-video-ad:${visitorId}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { message: "You're submitting too fast. Try again later." },
      { status: 429 },
    );
  }

  const ipLimit = rateLimit(`create-video-ad-ip:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = videoAdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    // The price the client sees and the price the webhook actually accepts
    // are the same constant — never the client's own number.
    const { data, error } = await admin
      .from("video_ads")
      .insert({
        name: parsed.data.name,
        destination_url: parsed.data.destination_url,
        video_url: parsed.data.video_url,
      x_handle: parsed.data.x_handle,
        amount: VIDEO_AD_PRICE_USD,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("video_ads insert failed", error);
      return NextResponse.json({ message: "Couldn't save your ad. Try again." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("video_ads creation crashed", error);
    return NextResponse.json({ message: "Couldn't save your ad. Try again." }, { status: 500 });
  }
}
