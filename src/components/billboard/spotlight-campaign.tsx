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
    <div className="billboard-surface-lg flex flex-col items-center gap-6 rounded-[2rem] p-6 text-center sm:p-12">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        #1 right now
      </span>

      <Link href={`/campaign/${campaign.slug}`}>
        <CampaignAvatar
          src={campaign.image_url}
          name={campaign.name}
          className="size-24 text-4xl sm:size-32 sm:text-5xl"
        />
      </Link>

      <div className="flex flex-col items-center gap-2">
        <Link
          href={`/campaign/${campaign.slug}`}
          className="text-2xl font-black tracking-tight hover:underline sm:text-4xl"
        >
          {campaign.name}
        </Link>
        <Badge variant={categoryAccent(campaign.category)}>
          {categoryLabel(campaign.category)}
        </Badge>
      </div>

      <PowerDisplay power={campaign.total_power} size="xl" />
      <p className="text-sm text-muted-foreground">
        {powerBreakdown(campaign.paid_power, campaign.vote_power)}
      </p>

      <p className="max-w-md text-sm text-muted-foreground">{campaign.description}</p>

      <div className="flex items-center gap-3">
        <VoteButton campaignId={campaign.id} onVoted={onVoted} size="lg" />
        <BoostButton
          campaignId={campaign.id}
          campaignName={campaign.name}
          size="lg"
          variant="outline"
        />
      </div>
    </div>
  );
}
