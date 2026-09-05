import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { VoteButton } from "@/components/billboard/vote-button";
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
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:px-4",
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
      <span className="shrink-0 text-sm font-bold tabular-nums">
        {formatPower(campaign.total_power)}
      </span>
      <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" className="shrink-0" />
    </div>
  );
}
