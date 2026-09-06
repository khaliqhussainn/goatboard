import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { CampaignHeroMascot } from "@/components/billboard/campaign-hero-mascot";
import { DestinationLink } from "@/components/campaign/destination-link";
import { ClickCount } from "@/components/campaign/click-count";
import { RankChip } from "@/components/billboard/rank-chip";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { powerBreakdown } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function CampaignTile({
  campaign,
  rank,
  onVoted,
}: {
  campaign: Campaign;
  rank: number;
  onVoted?: (totalPower: number) => void;
}) {
  return (
    <div className="billboard-surface flex h-full flex-col overflow-hidden rounded-2xl sm:flex-row">
      <Link
        href={`/campaign/${campaign.slug}`}
        className="relative block aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:w-[38%]"
      >
        <CampaignHeroMascot campaignId={campaign.id} rank={rank} className="size-full" />
        <RankChip rank={rank} className="absolute left-2 top-2 px-2 py-0.5 text-xs" />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={categoryAccent(campaign.category)}>
            {categoryLabel(campaign.category)}
          </Badge>
          {campaign.has_been_goat && <GoatBadge size="xs" />}
        </div>

        <Link
          href={`/campaign/${campaign.slug}`}
          className="flex min-w-0 items-center gap-1.5 hover:underline"
        >
          <CampaignAvatar
            src={campaign.image_url}
            name={campaign.name}
            className="size-5 shrink-0 text-[10px]"
          />
          <span className="truncate font-bold">{campaign.name}</span>
        </Link>

        <p className="line-clamp-1 text-xs text-muted-foreground">{campaign.description}</p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <DestinationLink campaignId={campaign.id} url={campaign.destination_url} />
          <ClickCount count={campaign.click_count} />
        </div>

        <PowerDisplay power={campaign.total_power} size="lg" className="mt-1" />
        <p className="text-xs text-muted-foreground">
          {powerBreakdown(campaign.paid_power, campaign.vote_power)}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" />
          <BoostButton
            campaignId={campaign.id}
            campaignName={campaign.name}
            size="sm"
            variant="outline"
          />
        </div>
      </div>
    </div>
  );
}
