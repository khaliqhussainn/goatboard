import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Purchases queue rather than overlap: a new slot starts when the current
 * live/queued one (if any) ends, or immediately if the board is open. Shared
 * by the Lemon Squeezy webhook and the admin "create for free" route so both
 * schedule a new slot the same way.
 */
export async function nextAdSlotStart(admin: SupabaseClient<Database>): Promise<Date> {
  const { data: current } = await admin
    .from("ad_slots")
    .select("ends_at")
    .eq("status", "paid")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return current?.ends_at ? new Date(current.ends_at) : new Date();
}
