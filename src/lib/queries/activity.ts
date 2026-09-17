import "server-only";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { categoryLabel } from "@/lib/categories";
import { formatPower, votesLabel } from "@/lib/utils";
import type { Activity, ActivityActor, ActivityKind } from "@/lib/activity";
import type { Campaign } from "@/lib/types";

/**
 * Turns the raw vote/purchase history into Activity records.
 *
 * There is no persisted rank history anywhere in the schema - campaigns only
 * ever holds the *current* vote_power/paid_power, the same on-read-compute
 * choice the 24-hour streak (sync_first_place) already makes rather than
 * adding a written-on-every-change log table. So this replays the window's
 * votes and purchases in order, rolling each campaign's current power back to
 * what it was at the start of the window (current minus everything that
 * happened inside it) and then walking forward event by event, comparing the
 * standings before and after each one.
 *
 * Only 5 of the 13 kinds in lib/activity.ts are derived here - the ones with
 * an objective trigger in the raw data. The rest (under_attack, power_gap,
 * biggest_climber, comeback, daily_battle, streak_progress) need a threshold
 * nobody has specified yet ("how close counts as closing in fast?"), so they
 * stay unused until that's decided.
 */

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 90;

// How many top spots count as "the board" for overtake purposes. Passing
// into #1 is its own kind (goat_change); this covers #2-#5.
const TOP_N_FOR_OVERTAKES = 5;

const VOTE_MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10_000, 25_000, 50_000, 100_000];

type RunningPower = { vote: number; paid: number };

function toActor(c: Campaign): ActivityActor {
  return { id: c.id, name: c.name, slug: c.slug, image_url: c.image_url };
}

function totalOf(p: RunningPower): number {
  return p.vote + p.paid;
}

/**
 * Campaign ids ordered the same way the board itself ranks them: power desc,
 * then whoever has gone longest without a power change. There's no real
 * updated_at history to tie-break against mid-replay, so this approximates it
 * with each campaign's most recent event inside this replay (or the window
 * start, for anyone untouched so far).
 */
function rankOrder(
  ids: string[],
  power: Map<string, RunningPower>,
  lastChangedAt: Map<string, string>,
): string[] {
  return [...ids].sort((a, b) => {
    const diff = totalOf(power.get(b)!) - totalOf(power.get(a)!);
    if (diff !== 0) return diff;
    return Date.parse(lastChangedAt.get(a)!) - Date.parse(lastChangedAt.get(b)!);
  });
}

type Draft = Omit<Activity, "id">;

type Event =
  | { type: "vote"; campaignId: string; at: string }
  | { type: "purchase"; campaignId: string; powerGranted: number; at: string };

/**
 * Everything that happened on the board in the last `days` days, newest
 * first. Falls back to an empty feed (rather than throwing) if Supabase
 * isn't configured or a read fails, same as the other stats queries - this
 * is a nice-to-have page, not something that should take the site down.
 */
export async function getActivityFeed(days: number = DEFAULT_WINDOW_DAYS): Promise<Activity[]> {
  const clampedDays = Math.min(Math.max(days, 1), MAX_WINDOW_DAYS);

  try {
    const admin = createAdminClient();
    const windowStart = new Date(Date.now() - clampedDays * 86_400_000);
    const windowStartISO = windowStart.toISOString();

    const [campaignsRes, votesRes, purchasesRes] = await Promise.all([
      admin.from("campaigns").select("*").eq("status", "active"),
      admin.from("votes").select("*").gte("created_at", windowStartISO),
      admin.from("purchases").select("*").eq("status", "paid").gte("created_at", windowStartISO),
    ]);

    if (campaignsRes.error) {
      console.error("activity: campaigns read failed", campaignsRes.error);
      return [];
    }
    if (votesRes.error) console.error("activity: votes read failed", votesRes.error);
    if (purchasesRes.error) console.error("activity: purchases read failed", purchasesRes.error);

    const campaigns = new Map<string, Campaign>((campaignsRes.data ?? []).map((c) => [c.id, c]));
    if (campaigns.size === 0) return [];

    // Roll current power back to what it was at windowStart by subtracting
    // everything that happened inside the window - the only history that
    // exists is the raw votes/purchases themselves.
    const power = new Map<string, RunningPower>();
    for (const c of campaigns.values()) {
      power.set(c.id, { vote: c.vote_power, paid: c.paid_power });
    }
    for (const v of votesRes.data ?? []) {
      const p = power.get(v.campaign_id);
      if (p) p.vote -= 1;
    }
    for (const purchase of purchasesRes.data ?? []) {
      const p = power.get(purchase.campaign_id);
      if (p) p.paid -= purchase.power_granted;
    }

    const lastChangedAt = new Map<string, string>(
      [...campaigns.keys()].map((id) => [id, windowStartISO]),
    );

    const events: Event[] = [
      ...(votesRes.data ?? []).map(
        (v): Event => ({ type: "vote", campaignId: v.campaign_id, at: v.created_at }),
      ),
      ...(purchasesRes.data ?? []).map(
        (p): Event => ({
          type: "purchase",
          campaignId: p.campaign_id,
          powerGranted: p.power_granted,
          at: p.created_at,
        }),
      ),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

    const drafts: Draft[] = [];
    let ranking = rankOrder([...campaigns.keys()], power, lastChangedAt);

    for (const event of events) {
      const c = campaigns.get(event.campaignId);
      const s = power.get(event.campaignId);
      if (!c || !s) continue; // not currently active/visible - skip

      if (event.type === "vote") {
        const before = s.vote;
        s.vote += 1;
        for (const milestone of VOTE_MILESTONES) {
          if (before < milestone && s.vote >= milestone) {
            drafts.push({
              kind: "vote_milestone",
              at: event.at,
              campaign: toActor(c),
              opponent: null,
              headline: `${c.name} passed ${milestone.toLocaleString("en-US")} votes`,
              detail: `${votesLabel(s.vote)} and climbing.`,
              stats: [{ label: "Votes", value: milestone.toLocaleString("en-US") }],
            });
          }
        }
      } else {
        s.paid += event.powerGranted;
      }

      lastChangedAt.set(event.campaignId, event.at);

      const nextRanking = rankOrder([...campaigns.keys()], power, lastChangedAt);
      const oldRank = ranking.indexOf(event.campaignId);
      const newRank = nextRanking.indexOf(event.campaignId);
      const kind: ActivityKind | null = newRank < oldRank ? (newRank === 0 ? "goat_change" : "overtake") : null;

      if (kind === "goat_change") {
        const prevLeaderId = ranking[0];
        const prevLeader =
          prevLeaderId && prevLeaderId !== event.campaignId ? campaigns.get(prevLeaderId) : null;
        drafts.push({
          kind: "goat_change",
          at: event.at,
          campaign: toActor(c),
          opponent: prevLeader ? toActor(prevLeader) : null,
          headline: `${c.name} is the new GOAT`,
          detail: prevLeader ? `Passed ${prevLeader.name} for the #1 spot.` : "Took the #1 spot.",
          stats: [{ label: "Power", value: formatPower(totalOf(s)) }],
        });
      } else if (kind === "overtake" && newRank < TOP_N_FOR_OVERTAKES) {
        const passedId = ranking[newRank];
        const passed = passedId && passedId !== event.campaignId ? campaigns.get(passedId) : null;
        if (passed) {
          drafts.push({
            kind: "overtake",
            at: event.at,
            campaign: toActor(c),
            opponent: toActor(passed),
            headline: `${c.name} passed ${passed.name}`,
            detail: `Now #${newRank + 1} on the board.`,
            stats: [{ label: "Now", value: `#${newRank + 1}` }],
          });
        }
      }

      ranking = nextRanking;
    }

    for (const c of campaigns.values()) {
      if (Date.parse(c.created_at) >= windowStart.getTime()) {
        drafts.push({
          kind: "new_listing",
          at: c.created_at,
          campaign: toActor(c),
          opponent: null,
          headline: `${c.name} joined the board`,
          detail: `New in ${categoryLabel(c.category)}.`,
          stats: [{ label: "Category", value: categoryLabel(c.category) }],
        });
      }
      if (c.held_24h_at && Date.parse(c.held_24h_at) >= windowStart.getTime()) {
        drafts.push({
          kind: "streak_win",
          at: c.held_24h_at,
          campaign: toActor(c),
          opponent: null,
          headline: `${c.name} held #1 for 24 hours straight`,
          detail: "Earned the 24-hour GOAT streak badge.",
          stats: [{ label: "Streak", value: "24h" }],
        });
      }
    }

    drafts.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return drafts.map((d, i) => ({ ...d, id: `${d.kind}-${d.campaign.id}-${i}` }));
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return [];
    }
    console.error("getActivityFeed crashed", error);
    return [];
  }
}
