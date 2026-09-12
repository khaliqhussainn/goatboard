import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AdSlotDuration } from "@/lib/types";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Postgres exclusion_violation — the ad_slots_no_overlap constraint firing. */
const EXCLUSION_VIOLATION = "23P01";

/** How many times to recompute a start date that lost a race before giving up. */
const MAX_BOOKING_ATTEMPTS = 4;

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

/**
 * Purchases queue rather than overlap: a new slot starts when the last
 * live/queued one ends, or immediately if the board is free. Ordering by
 * ends_at descending rather than starts_at is what makes this work with a
 * queue several deep — the slot to line up behind is the one that finishes
 * last, not the one that started last.
 */
export async function nextAdSlotStart(admin: SupabaseClient<Database>): Promise<Date> {
  const { data: last } = await admin
    .from("ad_slots")
    .select("ends_at")
    .eq("status", "paid")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return last?.ends_at ? new Date(last.ends_at) : new Date();
}

export type AdQueue = {
  /** When a booking made right now would start. */
  nextStart: string;
  /** Paid slots that have to finish first — 0 means the board is free now. */
  queuedCount: number;
  /** When the ad currently on the board finishes, if one is live. */
  liveUntil: string | null;
};

/**
 * The queue as the booking form needs to describe it: when the next slot
 * opens and how many ads are ahead of it. Read before payment so the buyer
 * sees real dates rather than "sometime after the current ad".
 */
export async function getAdQueue(admin: SupabaseClient<Database>): Promise<AdQueue> {
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("ad_slots")
    .select("starts_at, ends_at")
    .eq("status", "paid")
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false });

  const rows = data ?? [];
  const live = rows.find((r) => r.starts_at !== null && r.starts_at <= nowIso);

  // Normalised to ISO-8601 Z rather than passed through as Postgres writes
  // them (+00:00), so every timestamp this module hands out has one shape and
  // callers can compare them as strings.
  const iso = (value: string | null | undefined) =>
    value ? new Date(value).toISOString() : null;

  return {
    nextStart: iso(rows[0]?.ends_at) ?? nowIso,
    queuedCount: rows.length,
    liveUntil: iso(live?.ends_at),
  };
}

export type BookingResult =
  | { ok: true; startsAt: string; endsAt: string; alreadyProcessed: boolean }
  | { ok: false; reason: "not_found" | "duration_mismatch" | "no_slot" };

/**
 * Confirms a paid ad slot: works out where it lands in the queue and flips it
 * from pending to paid, in that order, retrying if it loses a race.
 *
 * Two things make this safe to call twice with the same order, which matters
 * because Lemon Squeezy retries webhooks:
 *
 *   - The update is conditional on status still being 'pending'. Postgres
 *     serialises concurrent updates to a row, so of two duplicate deliveries
 *     exactly one matches and the loser gets zero rows back rather than
 *     overwriting dates that were already assigned.
 *   - A row that is already paid returns its existing dates instead of being
 *     rescheduled, so a late retry can't push a running ad into the future.
 *
 * Overlap is prevented by the ad_slots_no_overlap exclusion constraint. If a
 * booking is written between this reading the queue and writing its own row,
 * the constraint rejects the write and the start date is recomputed.
 */
export async function bookAdSlot(
  admin: SupabaseClient<Database>,
  {
    adSlotId,
    durationDays,
    orderId,
  }: { adSlotId: string; durationDays: AdSlotDuration; orderId: string | null },
): Promise<BookingResult> {
  const { data: slot } = await admin
    .from("ad_slots")
    .select("id, status, duration_days, starts_at, ends_at")
    .eq("id", adSlotId)
    .maybeSingle();

  if (!slot) return { ok: false, reason: "not_found" };

  if (slot.status === "paid") {
    return {
      ok: true,
      startsAt: slot.starts_at!,
      endsAt: slot.ends_at!,
      alreadyProcessed: true,
    };
  }

  // The duration is whatever the row was created with; the caller passes what
  // the order claims, and the two disagreeing means the request was tampered
  // with somewhere between creation and payment.
  if (slot.duration_days !== durationDays) return { ok: false, reason: "duration_mismatch" };

  for (let attempt = 0; attempt < MAX_BOOKING_ATTEMPTS; attempt++) {
    const startsAt = await nextAdSlotStart(admin);
    const endsAt = addDays(startsAt, durationDays);

    const { data: updated, error } = await admin
      .from("ad_slots")
      .update({
        status: "paid",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        ...(orderId ? { lemon_squeezy_order_id: orderId } : {}),
      })
      .eq("id", adSlotId)
      .eq("status", "pending")
      .select("starts_at, ends_at");

    if (error) {
      // Someone else booked into the window we picked. Recompute and retry.
      if (error.code === EXCLUSION_VIOLATION) continue;
      console.error("ad slot booking failed", error);
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
      .from("ad_slots")
      .select("status, starts_at, ends_at")
      .eq("id", adSlotId)
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

  console.error("ad slot booking gave up after retries", adSlotId);
  return { ok: false, reason: "no_slot" };
}
