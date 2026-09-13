import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { VisitorStats } from "@/lib/types";

const EMPTY_STATS: VisitorStats = {
  totalVisits: 0,
  liveVisitors: 0,
  totalEarnings: 0,
  activity: [],
};

/**
 * Everything actually taken in money: boost purchases plus rented ad slots.
 *
 * Ad slots the admin created for free are excluded - they carry a list price
 * in `amount` like any other row, but no Lemon Squeezy order behind it, so
 * counting them would inflate this by whatever was only ever a test.
 */
async function getTotalEarnings(
  admin: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const [purchases, adSlots] = await Promise.all([
    admin.from("purchases").select("amount").eq("status", "paid"),
    admin.from("ad_slots").select("amount").eq("status", "paid").not("lemon_squeezy_order_id", "is", null),
  ]);

  if (purchases.error) console.error("earnings: purchases read failed", purchases.error);
  if (adSlots.error) console.error("earnings: ad_slots read failed", adSlots.error);

  const sum = (rows: { amount: number | string }[] | null) =>
    (rows ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return sum(purchases.data) + sum(adSlots.data);
}

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

    const [statsResult, activityResult, totalEarnings] = await Promise.all([
      admin.rpc("get_visitor_stats").single(),
      admin.rpc("get_visitor_activity"),
      getTotalEarnings(admin),
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
      totalEarnings,
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
