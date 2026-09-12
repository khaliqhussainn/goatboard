import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { adSlotSchema, AD_SLOT_PRICING } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`create-ad-slot:${visitorId}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { message: "You're submitting too fast. Try again later." },
      { status: 429 },
    );
  }

  const ipLimit = rateLimit(`create-ad-slot-ip:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    // The price the client sees and the price /api/ad-checkout and the
    // webhook will actually charge/accept are the same lookup — never the
    // client's own number.
    const amount = AD_SLOT_PRICING[parsed.data.duration_days];

    const { data, error } = await admin
      .from("ad_slots")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        destination_url: parsed.data.destination_url,
        image_url: parsed.data.image_url || null,
        backdrop_url: parsed.data.backdrop_url || null,
        duration_days: parsed.data.duration_days,
        amount,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("ad_slots insert failed", error);
      return NextResponse.json({ message: "Couldn't save your ad. Try again." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("ad_slots creation crashed", error);
    return NextResponse.json({ message: "Couldn't save your ad. Try again." }, { status: 500 });
  }
}
