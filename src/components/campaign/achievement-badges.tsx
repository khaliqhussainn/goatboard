"use client";

import * as React from "react";
import { Check, Code2 } from "lucide-react";
import { toast } from "sonner";
import { XLogo } from "@/components/icons/x-logo";
import {
  ACHIEVEMENT_DEFINITIONS,
  achievementEmbedCode,
  achievementPublicUrl,
} from "@/lib/achievements";
import type { CampaignAchievement, CampaignAchievementType } from "@/lib/types";

export function AchievementBadges({
  achievements,
  campaignName,
  slug,
  siteUrl,
  compact = false,
}: {
  achievements: CampaignAchievement[];
  campaignName: string;
  slug: string;
  siteUrl: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = React.useState<CampaignAchievementType | null>(null);

  if (achievements.length === 0) return null;

  async function copyEmbed(type: CampaignAchievementType) {
    try {
      await navigator.clipboard.writeText(achievementEmbedCode(siteUrl, slug, type));
      setCopied(type);
      toast.success("Embed code copied.");
      window.setTimeout(() => setCopied((current) => (current === type ? null : current)), 1800);
    } catch {
      toast.error("Could not copy the embed code.");
    }
  }

  return (
    <section aria-labelledby={`achievements-${slug}`}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Verified by leaderboard data
          </p>
          <h2 id={`achievements-${slug}`} className="text-base font-black tracking-tight">
            Achievements
          </h2>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const definition = ACHIEVEMENT_DEFINITIONS[achievement.achievement_type];
          const publicUrl = achievementPublicUrl(siteUrl, slug);
          const badgeUrl = `${siteUrl}/api/achievement-badges/${encodeURIComponent(slug)}/${achievement.achievement_type}`;
          const shareText = `${campaignName} earned “${definition.label}”.`;
          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`;

          return (
            <article
              key={achievement.achievement_type}
              className="min-w-0"
            >
              {/* The preview query keeps dashboard impressions out of external
                  embed analytics. The copied badge URL does not include it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${badgeUrl}?preview=1`}
                alt={definition.label}
                width={320}
                height={72}
                className="block h-auto w-full max-w-[320px]"
              />

              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyEmbed(achievement.achievement_type)}
                  aria-label={copied === achievement.achievement_type ? "Embed code copied" : "Copy Embed Code"}
                  className="group relative inline-flex size-8 items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-80"
                >
                  {copied === achievement.achievement_type ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Code2 className="size-3.5" />
                  )}
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {copied === achievement.achievement_type ? "Copied" : "Copy Embed Code"}
                  </span>
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share ${definition.label} on X`}
                  className="group relative inline-flex size-8 items-center justify-center rounded-lg border border-black/15 bg-white text-black transition-colors hover:bg-muted"
                >
                  <XLogo className="size-3.5" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Share on X
                  </span>
                </a>
              </div>

              {!compact && (achievement.view_count > 0 || achievement.click_count > 0) && (
                <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
                  {achievement.view_count.toLocaleString("en-US")} badge views ·{" "}
                  {achievement.click_count.toLocaleString("en-US")} clicks
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
