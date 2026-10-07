"use client";

import * as React from "react";
import { Award, Check, Code2, Flame, Rocket, Trophy } from "lucide-react";
import { toast } from "sonner";
import { XLogo } from "@/components/icons/x-logo";
import {
  ACHIEVEMENT_DEFINITIONS,
  achievementEmbedCode,
  achievementPublicUrl,
} from "@/lib/achievements";
import type { CampaignAchievement, CampaignAchievementType } from "@/lib/types";

const ICONS: Record<CampaignAchievementType, React.ComponentType<{ className?: string }>> = {
  launched: Rocket,
  top_3: Trophy,
  goat_of_week: Award,
  trending: Flame,
};

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
          const Icon = ICONS[achievement.achievement_type];
          const publicUrl = achievementPublicUrl(siteUrl, slug);
          const shareText = `${campaignName} earned “${definition.label}”.`;
          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`;

          return (
            <article
              key={achievement.achievement_type}
              className="rounded-2xl border border-black/10 p-3"
              style={{ backgroundColor: definition.background }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/10"
                  style={{ backgroundColor: definition.accent }}
                >
                  <Icon className="size-4 text-black" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black leading-tight">{definition.label}</p>
                  {!compact && (
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {definition.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => copyEmbed(achievement.achievement_type)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black px-2.5 text-[11px] font-bold text-white transition-opacity hover:opacity-80"
                >
                  {copied === achievement.achievement_type ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Code2 className="size-3.5" />
                  )}
                  {copied === achievement.achievement_type ? "Copied" : "Copy Embed Code"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/15 bg-white/75 px-2.5 text-[11px] font-bold text-black transition-colors hover:bg-white"
                >
                  <XLogo className="size-3.5" />
                  Share on X
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
