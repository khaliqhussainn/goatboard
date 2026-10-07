import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { StreakBadge } from "@/components/billboard/streak-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatPower, getSiteUrl } from "@/lib/utils";
import { ResumeListingButton } from "@/components/campaign/resume-listing-button";
import { AchievementBadges } from "@/components/campaign/achievement-badges";
import { syncCampaignAchievements } from "@/lib/queries/achievements";
import type { CampaignAchievement } from "@/lib/types";

export const metadata: Metadata = {
  title: "My Campaigns",
  description: "Every campaign you've put on GOATBOARD.",
  robots: { index: false, follow: false },
};

const STATUS_VARIANT = {
  active: "green",
  pending_payment: "yellow",
  suspended: "yellow",
  removed: "pink",
} as const;

const STATUS_LABEL = {
  active: "active",
  pending_payment: "awaiting payment",
  suspended: "suspended",
  removed: "removed",
} as const;

export default async function MinePage() {
  const visitorId = await getVisitorId();
  const admin = createAdminClient();

  const { data: campaigns } = visitorId
    ? await admin
        .from("campaigns")
        .select("*")
        .eq("created_by", visitorId)
        .order("created_at", { ascending: false })
    : { data: [] };

  await syncCampaignAchievements();
  const campaignIds = (campaigns ?? [])
    .filter((campaign) => campaign.status === "active")
    .map((campaign) => campaign.id);
  const { data: achievementRows } = campaignIds.length
    ? await admin
        .from("campaign_achievements")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("awarded_at", { ascending: false })
    : { data: [] };

  const achievementsByCampaign = new Map<string, CampaignAchievement[]>();
  for (const achievement of achievementRows ?? []) {
    const existing = achievementsByCampaign.get(achievement.campaign_id) ?? [];
    if (!existing.some((item) => item.achievement_type === achievement.achievement_type)) {
      existing.push(achievement);
      achievementsByCampaign.set(achievement.campaign_id, existing);
    }
  }

  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">My Campaigns</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every startup, product, or idea you&apos;ve put on the board - no account required,
            this browser is your key.
          </p>
        </div>
        <Link href="/create" className="shrink-0">
          <Button variant="abstract">New campaign</Button>
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="billboard-surface-lg flex flex-col items-center gap-4 rounded-[2rem] py-20 text-center">
          <p className="text-xl font-black tracking-tight">Nothing here yet.</p>
          <p className="text-sm text-muted-foreground">
            Campaigns you create in this browser will show up here.
          </p>
          <Link href="/create">
            <Button size="lg" variant="abstract">
              Create Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((c) => {
            // An unpaid campaign has no public page to link to - every read
            // of /campaign/[slug] filters on active - so it renders as a
            // plain card offering the way back to checkout instead.
            const pending = c.status === "pending_payment";

            const inner = (
              <>
                <CampaignAvatar src={c.image_url} name={c.name} className="size-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold">{c.name}</p>
                    <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    <Badge variant={categoryAccent(c.category)}>{categoryLabel(c.category)}</Badge>
                    {c.has_been_goat && <GoatBadge size="xs" />}
                    {c.held_24h_at && <StreakBadge size="xs" />}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {pending ? "Not on the board yet - finish the $1 listing to publish it." : c.description}
                  </p>
                </div>
                {pending ? (
                  <ResumeListingButton campaignId={c.id} />
                ) : (
                  <p className="shrink-0 text-lg font-black tabular-nums">
                    {formatPower(c.total_power)}
                  </p>
                )}
              </>
            );

            return pending ? (
              <div
                key={c.id}
                className="billboard-surface-sm flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                {inner}
              </div>
            ) : (
              <div
                key={c.id}
                className="billboard-surface-sm rounded-2xl p-4"
              >
                <Link
                  href={`/campaign/${c.slug}`}
                  className="flex items-center gap-4 transition-transform hover:-translate-y-0.5"
                >
                  {inner}
                </Link>
                {(achievementsByCampaign.get(c.id)?.length ?? 0) > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <AchievementBadges
                      achievements={achievementsByCampaign.get(c.id) ?? []}
                      campaignName={c.name}
                      slug={c.slug}
                      siteUrl={getSiteUrl()}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
