import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVideoAdQueue } from "@/lib/video-ads";

/** Never cached: the answer changes the moment anyone books. */
export const dynamic = "force-dynamic";

/**
 * What the booking form needs to show real dates before payment — when the
 * next 7-day window opens and how many videos are ahead of it. Same idea as
 * /api/ad-slots/availability, just for the one fixed duration this is sold as.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const queue = await getVideoAdQueue(admin);
    return NextResponse.json(queue);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("video ad availability failed", error);
    return NextResponse.json({ message: "Couldn't load availability." }, { status: 500 });
  }
}
