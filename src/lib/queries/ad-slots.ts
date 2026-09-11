import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { CurrentAd } from "@/lib/types";

/**
 * Reads the ad slot shown below the #1 spotlight. Falls back to null instead
 * of throwing if get_current_ad() hasn't been migrated into the database
 * yet, so the homepage still renders (just shows the "rent this spot" CTA)
 * during that gap — same pattern as getVisitorStats.
 */
export async function getCurrentAd(): Promise<CurrentAd | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_current_ad");

    if (error) {
      console.error("get_current_ad failed", error);
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
