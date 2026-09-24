import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { VisitorStats } from "@/lib/types";

const EMPTY_STATS: VisitorStats = {
  totalVisits: 0,
  liveVisitors: 0,
  totalEarnings: 0,
  activity: [],
};

/**
 * Everything actually taken in money, across all five things the site
 * sells: boosts, rented ad slots, the video demo spot, Get Listed
 * campaigns, and the $1 charge to publish a new campaign listing.
 *
 * Keep this in step with the schema. Every table carrying an `amount`
 * column belongs here, and the list is exactly:
 *
 *   purchases, ad_slots, video_ads, get_listed_orders, listing_orders
 *
 * video_ads was added after this function and missed for a while, which
 * quietly under-reported the total by every video sold.
 *
 * Each is filtered to its own paid state, which is also what keeps refunded
 * and cancelled rows out - a Get Listed order that was refunded carries the
 * amount it was sold at, and counting it would report money we gave back.
 *
 * Ad slots and videos the admin created for free are excluded too: they
 * carry a list price like any other row but no Lemon Squeezy order behind
 * it, so counting them would inflate this by whatever was only ever a test.
 */
async function getTotalEarnings(
  admin: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const [purchases, adSlots, videoAds, getListed, listings] = await Promise.all([
    admin.from("purchases").select("amount").eq("status", "paid"),
    admin
      .from("ad_slots")
      .select("amount")
      .eq("status", "paid")
      .not("lemon_squeezy_order_id", "is", null),
    admin
      .from("video_ads")
      .select("amount")
      .eq("status", "paid")
      .not("lemon_squeezy_order_id", "is", null),
    admin.from("get_listed_orders").select("amount").eq("payment_status", "paid"),
    admin.from("listing_orders").select("amount").eq("payment_status", "paid"),
  ]);

  if (purchases.error) console.error("earnings: purchases read failed", purchases.error);
  if (adSlots.error) console.error("earnings: ad_slots read failed", adSlots.error);
  if (videoAds.error) console.error("earnings: video_ads read failed", videoAds.error);
  if (getListed.error) console.error("earnings: get_listed_orders read failed", getListed.error);
  if (listings.error) console.error("earnings: listing_orders read failed", listings.error);

  const sum = (rows: { amount: number | string }[] | null) =>
    (rows ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return (
    sum(purchases.data) +
    sum(adSlots.data) +
    sum(videoAds.data) +
    sum(getListed.data) +
    sum(listings.data)
  );
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
