/**
 * The activity feed's vocabulary: what can happen on the board, and how each
 * kind of happening looks.
 *
 * Client-safe on purpose - the feed page, the filter bar and the cards all
 * import from here, and none of them should pull the server-only replay in
 * queries/activity.ts into the browser bundle.
 */

export const ACTIVITY_KINDS = [
  "goat_change",
  "streak_win",
  "streak_progress",
  "overtake",
  "under_attack",
  "climb",
  "drop",
  "biggest_climber",
  "comeback",
  "daily_battle",
  "vote_milestone",
  "power_gap",
  "new_listing",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type ActivityStat = { label: string; value: string };

export type ActivityActor = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type Activity = {
  /** Stable across renders so React keys and filters behave. */
  id: string;
  kind: ActivityKind;
  /** ISO timestamp. The feed is ordered by this. */
  at: string;
  campaign: ActivityActor;
  /** The other side of a two-sided event: who was passed, who is attacking. */
  opponent?: ActivityActor | null;
  /** Short enough to post as-is. */
  headline: string;
  detail: string;
  stats: ActivityStat[];
  /** Still true right now, not just a thing that happened. Pinned as live. */
  live?: boolean;
};

type KindConfig = {
  label: string;
  /** Short word on the card's corner tag. */
  tag: string;
  /** CSS custom property from globals.css, used for the card's accent. */
  color: string;
  /** Readable ink for text sitting on that colour. */
  ink: string;
  /** Which mascot pose fits what just happened. */
  mascot: string;
};

/**
 * Pose per kind, chosen by looking at the art rather than by index: goat-5 is
 * climbing a bar chart, goat-18 is diving downward, goat-3 has the boxing
 * gloves on. A drop should not be celebrating.
 */
export const ACTIVITY_CONFIG: Record<ActivityKind, KindConfig> = {
  goat_change: {
    label: "New GOAT",
    tag: "GOAT",
    color: "var(--hero-yellow)",
    ink: "#4a3a00",
    mascot: "/mascots/goat-2.webp",
  },
  streak_win: {
    label: "24-hour GOAT",
    tag: "24H",
    color: "var(--gold)",
    ink: "#2a2000",
    mascot: "/mascots/goat-11.webp",
  },
  streak_progress: {
    label: "GOAT run",
    tag: "RUN",
    color: "var(--hero-teal)",
    ink: "#00302a",
    mascot: "/mascots/goat-15.webp",
  },
  overtake: {
    label: "Overtake",
    tag: "PASS",
    color: "var(--hero-purple)",
    ink: "#2b0a52",
    mascot: "/mascots/goat-13.webp",
  },
  under_attack: {
    label: "Under attack",
    tag: "HEAT",
    color: "var(--hero-red)",
    ink: "#4a0b06",
    mascot: "/mascots/goat-3.webp",
  },
  climb: {
    label: "Climbing",
    tag: "UP",
    color: "var(--hero-green)",
    ink: "#053d22",
    mascot: "/mascots/goat-5.webp",
  },
  drop: {
    label: "Slipping",
    tag: "DOWN",
    color: "var(--hero-orange)",
    ink: "#4a2400",
    mascot: "/mascots/goat-18.webp",
  },
  biggest_climber: {
    label: "Biggest climber",
    tag: "TOP GAIN",
    color: "var(--hero-green)",
    ink: "#053d22",
    mascot: "/mascots/goat-8.webp",
  },
  comeback: {
    label: "Comeback",
    tag: "BACK",
    color: "var(--hero-purple)",
    ink: "#2b0a52",
    mascot: "/mascots/goat-4.webp",
  },
  daily_battle: {
    label: "Battle of the day",
    tag: "BATTLE",
    color: "var(--hero-pink)",
    ink: "#4a0022",
    mascot: "/mascots/goat-14.webp",
  },
  vote_milestone: {
    label: "Milestone",
    tag: "MILE",
    color: "var(--hero-blue)",
    ink: "#0a2352",
    mascot: "/mascots/goat-9.webp",
  },
  power_gap: {
    label: "Power gap",
    tag: "GAP",
    color: "var(--hero-yellow)",
    ink: "#4a3a00",
    mascot: "/mascots/goat-7.webp",
  },
  new_listing: {
    label: "New on the board",
    tag: "NEW",
    color: "var(--hero-blue)",
    ink: "#0a2352",
    mascot: "/mascots/goat-1.webp",
  },
};

/** Groupings for the filter bar, so thirteen kinds don't become thirteen chips. */
export const ACTIVITY_FILTERS: { key: string; label: string; kinds: ActivityKind[] }[] = [
  { key: "all", label: "Everything", kinds: [...ACTIVITY_KINDS] },
  { key: "goat", label: "GOAT", kinds: ["goat_change", "streak_win", "streak_progress"] },
  { key: "battles", label: "Battles", kinds: ["overtake", "under_attack", "daily_battle"] },
  { key: "movement", label: "Movement", kinds: ["climb", "drop", "biggest_climber", "comeback"] },
  { key: "milestones", label: "Milestones", kinds: ["vote_milestone", "power_gap"] },
  { key: "new", label: "New", kinds: ["new_listing"] },
];

export function ordinalRank(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `#${n}`;
  return `#${n}`;
}

/** "3m", "5h", "2d" - a scoreboard clock, not a sentence. */
export function shortAgo(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** The text that goes on X, assembled from the parts already on the card. */
export function shareTextFor(activity: Activity, siteUrl: string): string {
  const stats = activity.stats.map((s) => `${s.label}: ${s.value}`).join("  ·  ");
  return `${activity.headline}\n\n${stats}\n\n${siteUrl}/campaign/${activity.campaign.slug}`;
}
