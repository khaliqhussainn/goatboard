import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextAdSlotStart, addDays } from "@/lib/ad-slots";
import { adSlotSchema, AD_SLOT_PRICING } from "@/lib/validation";

/**
 * Admin-only "create for free" — same schema/scheduling as a real purchase
 * (see the Lemon Squeezy webhook) but skips checkout entirely and inserts
 * already status: "paid", so the admin can test the live ad slot without
 * paying. lemon_squeezy_order_id stays null, which is what tells a real
 * purchase apart from one of these in the admin list.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // Queues behind whatever is already booked, exactly like a paid slot does.
  const startsAt = await nextAdSlotStart(admin);
  const endsAt = addDays(startsAt, parsed.data.duration_days);

  const { error } = await admin.from("ad_slots").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    destination_url: parsed.data.destination_url,
    image_url: parsed.data.image_url || null,
    backdrop_url: parsed.data.backdrop_url || null,
    duration_days: parsed.data.duration_days,
    amount: AD_SLOT_PRICING[parsed.data.duration_days],
    status: "paid",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  if (error) {
    console.error("admin ad_slots insert failed", error);
    return NextResponse.json({ message: "Couldn't create ad slot." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
