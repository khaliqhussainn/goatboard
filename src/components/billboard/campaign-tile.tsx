import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
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
    <div className="billboard-surface flex h-full flex-col gap-3 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="text-lg font-black text-muted-foreground">#{rank}</span>
        <Link href={`/campaign/${campaign.slug}`}>
          <CampaignAvatar src={campaign.image_url} name={campaign.name} className="size-12" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/campaign/${campaign.slug}`}
            className="block truncate font-bold hover:underline"
          >
            {campaign.name}
          </Link>
          <Badge variant={categoryAccent(campaign.category)} className="mt-0.5">
            {categoryLabel(campaign.category)}
          </Badge>
        </div>
      </div>

      <PowerDisplay power={campaign.total_power} size="lg" />

      <div className="mt-auto flex items-center gap-2">
        <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" />
      </div>
    </div>
  );
}
