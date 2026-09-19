import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The only duration this is ever sold as - unlike ad_slots, there's no per-row column for it. */
export const VIDEO_AD_DURATION_DAYS = 7;

/** Postgres exclusion_violation — the video_ads_no_overlap constraint firing. */
const EXCLUSION_VIOLATION = "23P01";

/** How many times to recompute a start date that lost a race before giving up. */
const MAX_BOOKING_ATTEMPTS = 4;

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

/**
 * Purchases queue rather than overlap, same as the ad slot: a new video
 * starts when the last live/queued one ends, or immediately if the spot is
 * free. Ordered by ends_at descending so this still works with a queue
 * several deep.
 */
export async function nextVideoAdStart(admin: SupabaseClient<Database>): Promise<Date> {
  const { data: last } = await admin
    .from("video_ads")
    .select("ends_at")
    .eq("status", "paid")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return last?.ends_at ? new Date(last.ends_at) : new Date();
}

export type VideoAdQueue = {
  /** When a booking made right now would start. */
  nextStart: string;
  /** When a booking made right now would end - always +VIDEO_AD_DURATION_DAYS from nextStart. */
  endsAt: string;
  /** Paid videos that have to finish first — 0 means the spot is free now. */
  queuedCount: number;
  /** When the video currently playing finishes, if one is live. */
  liveUntil: string | null;
};

/** The queue as the booking form needs to describe it, read before payment so the buyer sees real dates. */
export async function getVideoAdQueue(admin: SupabaseClient<Database>): Promise<VideoAdQueue> {
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("video_ads")
    .select("starts_at, ends_at")
    .eq("status", "paid")
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false });

  const rows = data ?? [];
  const live = rows.find((r) => r.starts_at !== null && r.starts_at <= nowIso);

  const iso = (value: string | null | undefined) =>
    value ? new Date(value).toISOString() : null;

  const nextStart = iso(rows[0]?.ends_at) ?? nowIso;
  return {
    nextStart,
    endsAt: addDays(new Date(nextStart), VIDEO_AD_DURATION_DAYS).toISOString(),
    queuedCount: rows.length,
    liveUntil: iso(live?.ends_at),
  };
}

export type VideoBookingResult =
  | { ok: true; startsAt: string; endsAt: string; alreadyProcessed: boolean }
  | { ok: false; reason: "not_found" | "no_slot" };

/**
 * Confirms a paid video ad: works out where it lands in the queue and flips
 * it from pending to paid. Same idempotency shape as bookAdSlot (see
 * lib/ad-slots.ts) - the update is conditional on status still being
 * 'pending', and a row that's already paid returns its existing dates
 * instead of being rescheduled, so a Lemon Squeezy webhook retry can never
 * push a running video into the future or double-book the queue. Overlap
 * itself is prevented by the video_ads_no_overlap exclusion constraint.
 */
export async function bookVideoAd(
  admin: SupabaseClient<Database>,
  { videoAdId, orderId }: { videoAdId: string; orderId: string | null },
): Promise<VideoBookingResult> {
  const { data: ad } = await admin
    .from("video_ads")
    .select("id, status, starts_at, ends_at")
    .eq("id", videoAdId)
    .maybeSingle();

  if (!ad) return { ok: false, reason: "not_found" };

  if (ad.status === "paid") {
    return { ok: true, startsAt: ad.starts_at!, endsAt: ad.ends_at!, alreadyProcessed: true };
  }

  for (let attempt = 0; attempt < MAX_BOOKING_ATTEMPTS; attempt++) {
    const startsAt = await nextVideoAdStart(admin);
    const endsAt = addDays(startsAt, VIDEO_AD_DURATION_DAYS);

    const { data: updated, error } = await admin
      .from("video_ads")
      .update({
        status: "paid",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        ...(orderId ? { lemon_squeezy_order_id: orderId } : {}),
      })
      .eq("id", videoAdId)
      .eq("status", "pending")
      .select("starts_at, ends_at");

    if (error) {
      // Someone else booked into the window we picked. Recompute and retry.
      if (error.code === EXCLUSION_VIOLATION) continue;
      console.error("video ad booking failed", error);
      return { ok: false, reason: "no_slot" };
    }

    if (updated && updated.length > 0) {
      return {
        ok: true,
        startsAt: updated[0].starts_at!,
        endsAt: updated[0].ends_at!,
        alreadyProcessed: false,
      };
    }

    // Zero rows: a concurrent delivery of this same order got there first.
    const { data: settled } = await admin
      .from("video_ads")
      .select("status, starts_at, ends_at")
      .eq("id", videoAdId)
      .maybeSingle();

    if (settled?.status === "paid") {
      return {
        ok: true,
        startsAt: settled.starts_at!,
        endsAt: settled.ends_at!,
        alreadyProcessed: true,
      };
    }
  }

  console.error("video ad booking gave up after retries", videoAdId);
  return { ok: false, reason: "no_slot" };
}

/** Exported for the availability route and the admin "create for free" route, same as addDays in lib/ad-slots.ts. */
export { addDays };
