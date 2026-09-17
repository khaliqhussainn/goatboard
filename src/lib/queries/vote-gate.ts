import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_GATE_WINDOW_MS } from "@/lib/listing";
import type { Campaign } from "@/lib/types";

/**
 * Has this visitor cast a real vote recently enough to list a campaign?
 *
 * Reads the votes table itself rather than any flag the browser could set:
 * the only way to satisfy this is to have gone through cast_vote, which owns
 * the one-per-campaign-per-day rule. That makes the gate the same thing as
 * the voting system, not a second copy of it.
 *
 * Used by the create page to decide what to show, and by POST /api/campaigns
 * to decide what to allow. The second one is the one that counts.
 */
export async function hasVotedRecently(visitorId: string): Promise<boolean> {
  const since = new Date(Date.now() - VOTE_GATE_WINDOW_MS).toISOString();

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("voter_id", visitorId)
    .gte("created_at", since);

  if (error) {
    console.error("vote gate check failed", error);
    // Fail closed: a listing is a paid, public action, so an unreadable
    // votes table means "not yet", never "go ahead".
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Is this visitor allowed to start a listing?
 *
 * The vote requirement, plus the one case where it has to yield: if there is
 * nothing on the board to vote for, the gate would be a locked door with no
 * key - the first campaign could never be listed, and neither could the next
 * one if every campaign were ever suspended at once.
 */
export async function isVoteGateSatisfied(visitorId: string): Promise<boolean> {
  if (await hasVotedRecently(visitorId)) return true;

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Fail closed on a read error, as above.
  if (error) return false;
  return (count ?? 0) === 0;
}

/**
 * Startups to offer on the vote step.
 *
 * Shuffled from a wide pool rather than "the current top N", so the required
 * vote spreads across the board instead of compounding whoever is already
 * winning. The shuffle lives here rather than in the page because picking at
 * random during a component's render is exactly what react-hooks/purity is
 * there to stop.
 */
export async function getVoteCandidates(count: number): Promise<Campaign[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("total_power", { ascending: false })
    .limit(40);

  if (error) {
    console.error("vote candidates read failed", error);
    return [];
  }

  const pool = [...(data ?? [])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
