import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
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
    <div className="billboard-surface-lg flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:gap-7 sm:p-7">
      <div className="flex flex-col items-center gap-3 text-center sm:shrink-0 sm:items-start sm:text-left">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          🐐 GOAT right now
        </span>
        <Link href={`/campaign/${campaign.slug}`}>
          <CampaignAvatar
            src={campaign.image_url}
            name={campaign.name}
            className="size-20 text-3xl sm:size-24 sm:text-4xl"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Link
            href={`/campaign/${campaign.slug}`}
            className="text-xl font-black tracking-tight hover:underline sm:text-2xl"
          >
            {campaign.name}
          </Link>
          <Badge variant={categoryAccent(campaign.category)}>
            {categoryLabel(campaign.category)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:justify-start">
          <PowerDisplay power={campaign.total_power} size="lg" />
          <span className="text-sm text-muted-foreground">
            {powerBreakdown(campaign.paid_power, campaign.vote_power)}
          </span>
        </div>

        <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">
          {campaign.description}
        </p>

        <div className="flex items-center gap-3 pt-1">
          <VoteButton campaignId={campaign.id} onVoted={onVoted} />
          <BoostButton campaignId={campaign.id} campaignName={campaign.name} variant="outline" />
        </div>
      </div>
    </div>
  );
}
