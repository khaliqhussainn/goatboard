import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { VisitorStats } from "@/lib/types";

const EMPTY_STATS: VisitorStats = { totalVisits: 0, liveVisitors: 0, activity: [] };

/**
 * Reads the homepage stats widget's data. Uses the admin client, same as
 * every other RPC call in this codebase (see votes/route.ts) — the
 * functions themselves are security definer and granted to anon, so this
 * doesn't grant anything extra, it just keeps one client pattern per route.
 *
 * Falls back to zeroed stats instead of throwing if the RPC functions from
 * supabase/schema.sql haven't been applied to the database yet, so the
 * homepage still renders during that gap.
 */
export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const admin = createAdminClient();

    const [statsResult, activityResult] = await Promise.all([
      admin.rpc("get_visitor_stats").single(),
      admin.rpc("get_visitor_activity"),
    ]);

    if (statsResult.error) {
      console.error("get_visitor_stats failed", statsResult.error);
      return EMPTY_STATS;
    }

    const activity = activityResult.error ? [] : (activityResult.data ?? []);
    if (activityResult.error) {
      console.error("get_visitor_activity failed", activityResult.error);
    }

    return {
      totalVisits: statsResult.data?.total_visits ?? 0,
      liveVisitors: statsResult.data?.live_visitors ?? 0,
      activity: activity.map((row) => ({ hour: row.hour_start, visits: row.visits })),
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return EMPTY_STATS;
    }
    throw error;
  }
}
