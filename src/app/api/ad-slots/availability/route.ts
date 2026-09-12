import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getAdQueue, addDays } from "@/lib/ad-slots";
import { AD_SLOT_DURATIONS } from "@/lib/validation";

/** Never cached: the answer changes the moment anyone books. */
export const dynamic = "force-dynamic";

/**
 * What the booking form needs to show real dates before payment — when the
 * next slot opens, how many ads are ahead of it, and the window each duration
 * would actually run for.
 *
 * These are the dates a booking made right now would get. They can still move
 * if someone else pays first, which is why the slot is only assigned for real
 * once the webhook confirms payment.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const queue = await getAdQueue(admin);
    const start = new Date(queue.nextStart);

    return NextResponse.json({
      ...queue,
      options: AD_SLOT_DURATIONS.map((days) => ({
        days,
        startsAt: queue.nextStart,
        endsAt: addDays(start, days).toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("ad slot availability failed", error);
    return NextResponse.json({ message: "Couldn't load availability." }, { status: 500 });
  }
}
