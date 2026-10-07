import type { CampaignAchievementType } from "@/lib/types";

export type AchievementDefinition = {
  type: CampaignAchievementType;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  background: string;
};

export const ACHIEVEMENT_DEFINITIONS: Record<
  CampaignAchievementType,
  AchievementDefinition
> = {
  launched: {
    type: "launched",
    label: "Launched on GoatBoard",
    shortLabel: "Launched",
    description: "Published as a verified GoatBoard launch.",
    accent: "#efb91f",
    background: "#fff8dc",
  },
  top_3: {
    type: "top_3",
    label: "Top 3 on GoatBoard",
    shortLabel: "Top 3",
    description: "Reached one of the top three positions on the live leaderboard.",
    accent: "#7c5cff",
    background: "#f1edff",
  },
  goat_of_week: {
    type: "goat_of_week",
    label: "GOAT of the Week",
    shortLabel: "GOAT of the Week",
    description: "Earned the most verified Power during a completed GoatBoard week.",
    accent: "#ff5c3d",
    background: "#fff0eb",
  },
  trending: {
    type: "trending",
    label: "Trending on GoatBoard",
    shortLabel: "Trending",
    description: "Led GoatBoard's verified Power growth over a 24-hour window.",
    accent: "#19a974",
    background: "#e9fbf3",
  },
};

export const ACHIEVEMENT_TYPES = Object.keys(
  ACHIEVEMENT_DEFINITIONS,
) as CampaignAchievementType[];

export function isAchievementType(value: string): value is CampaignAchievementType {
  return ACHIEVEMENT_TYPES.includes(value as CampaignAchievementType);
}

export function achievementPublicUrl(siteUrl: string, slug: string): string {
  return `${siteUrl}/campaign/${encodeURIComponent(slug)}`;
}

export function achievementEmbedCode(
  siteUrl: string,
  slug: string,
  type: CampaignAchievementType,
): string {
  const definition = ACHIEVEMENT_DEFINITIONS[type];
  const badgeUrl = `${siteUrl}/api/achievement-badges/${encodeURIComponent(slug)}/${type}`;
  const clickUrl = `${badgeUrl}/click`;

  return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="${definition.label}" width="320" height="72" loading="lazy" style="display:block;max-width:100%;height:auto" /></a>`;
}
