import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { formatPower, cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function RankingRow({
  campaign,
  rank,
  onVoted,
}: {
  campaign: Campaign;
  rank: number;
  onVoted?: (totalPower: number) => void;
}) {
  return (
    <div
      className={cn(
        "billboard-surface-sm flex items-center gap-3 rounded-xl px-3 py-2.5 sm:px-4",
      )}
    >
      <span className="w-7 shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
        #{rank}
      </span>
      <Link href={`/campaign/${campaign.slug}`} className="shrink-0">
        <CampaignAvatar src={campaign.image_url} name={campaign.name} className="size-8" />
      </Link>
      <Link
        href={`/campaign/${campaign.slug}`}
        className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline"
      >
        {campaign.name}
      </Link>
      {campaign.has_been_goat && <GoatBadge size="xs" className="shrink-0" />}
      <span className="shrink-0 text-sm font-bold tabular-nums">
        {formatPower(campaign.total_power)}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" />
        <BoostButton
          campaignId={campaign.id}
          campaignName={campaign.name}
          size="sm"
          variant="outline"
        />
      </div>
    </div>
  );
}
