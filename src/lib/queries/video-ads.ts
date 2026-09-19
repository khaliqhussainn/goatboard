import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { CurrentVideoAd } from "@/lib/types";

/**
 * Reads the video ad shown beside the ad slot. Falls back to null instead of
 * throwing if get_current_video_ad() hasn't been migrated into the database
 * yet, so the homepage still renders (just shows the "your video could be
 * here" CTA) during that gap — same pattern as getCurrentAd.
 */
export async function getCurrentVideoAd(): Promise<CurrentVideoAd | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_current_video_ad");

    if (error) {
      console.error("get_current_video_ad failed", error);
      return null;
    }

    return data?.[0] ?? null;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return null;
    }
    throw error;
  }
}
