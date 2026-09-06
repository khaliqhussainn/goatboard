import Link from "next/link";
import { CampaignHeroImage } from "@/components/campaign/campaign-hero-image";
import { DestinationLink } from "@/components/campaign/destination-link";
import { ClickCount } from "@/components/campaign/click-count";
import { RankChip } from "@/components/billboard/rank-chip";
import { GoatMascot } from "@/components/billboard/goat-mascot";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { powerBreakdown } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function SpotlightCampaign({
  campaign,
  onVoted,
}: {
  campaign: Campaign;
  onVoted?: (totalPower: number) => void;
}) {
  return (
    <div className="billboard-surface-lg flex flex-col overflow-hidden rounded-[1.75rem] sm:flex-row sm:items-stretch">
      <Link
        href={`/campaign/${campaign.slug}`}
        className="relative block aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:w-[42%]"
      >
        <CampaignHeroImage src={campaign.image_url} name={campaign.name} className="size-full" />
        <RankChip rank={1} className="absolute left-3 top-3" />
        <GoatMascot
          seed={campaign.id}
          className="absolute -bottom-4 -right-4 size-32 rotate-3 sm:size-44"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-7">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          🐐 GOAT right now
        </span>

        <Badge variant={categoryAccent(campaign.category)} className="w-fit">
          {categoryLabel(campaign.category)}
        </Badge>

        <Link
          href={`/campaign/${campaign.slug}`}
          className="text-2xl font-black tracking-tight hover:underline sm:text-3xl"
        >
          {campaign.name}
        </Link>

        <p className="line-clamp-1 text-sm text-muted-foreground">{campaign.description}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <DestinationLink campaignId={campaign.id} url={campaign.destination_url} />
          <ClickCount count={campaign.click_count} className="text-xs" />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <PowerDisplay power={campaign.total_power} size="lg" />
          <span className="text-sm text-muted-foreground">
            {powerBreakdown(campaign.paid_power, campaign.vote_power)}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-3 pt-1">
          <VoteButton campaignId={campaign.id} onVoted={onVoted} />
          <BoostButton campaignId={campaign.id} campaignName={campaign.name} variant="outline" />
        </div>
      </div>
    </div>
  );
}
