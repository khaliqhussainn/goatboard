import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextVideoAdStart, addDays, VIDEO_AD_DURATION_DAYS } from "@/lib/video-ads";
import { videoAdSchema, VIDEO_AD_PRICE_USD } from "@/lib/validation";

/**
 * Admin-only "create for free" — same schema/scheduling as a real purchase
 * (see the Lemon Squeezy webhook) but skips checkout entirely and inserts
 * already status: "paid", so the admin can test the live video spot without
 * paying. lemon_squeezy_order_id stays null, which is what tells a real
 * purchase apart from one of these in the admin list.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = videoAdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // Queues behind whatever is already booked, exactly like a paid video does.
  const startsAt = await nextVideoAdStart(admin);
  const endsAt = addDays(startsAt, VIDEO_AD_DURATION_DAYS);

  const { error } = await admin.from("video_ads").insert({
    name: parsed.data.name,
    destination_url: parsed.data.destination_url,
    video_url: parsed.data.video_url,
    amount: VIDEO_AD_PRICE_USD,
    status: "paid",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  if (error) {
    console.error("admin video_ads insert failed", error);
    return NextResponse.json({ message: "Couldn't create video ad." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
