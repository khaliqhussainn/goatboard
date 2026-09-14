import "server-only";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";

/**
 * Advances the 24-hour #1 streak: starts the clock for whoever is top,
 * clears it for anyone who has been overtaken, and stamps the award once the
 * leader passes 24 consecutive hours.
 *
 * Called before reading the board rather than from a trigger. A campaign
 * stops being #1 because some other row changed, and the award turns on time
 * passing rather than on any row changing at all - so there is no write to
 * hang a trigger off. Doing it on read means any visitor loading the page
 * advances the state for everyone, which is also what makes it survive a
 * refresh: the timer lives in the database, not in the tab.
 *
 * Swallows its errors on purpose. This is bookkeeping; if the function hasn't
 * been migrated in yet, or the call fails, the board must still render.
 */
export async function syncFirstPlace(): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("sync_first_place");
    if (error) console.error("sync_first_place failed", error);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return;
    }
    console.error("sync_first_place crashed", error);
  }
}
