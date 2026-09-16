import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { ShareXButton } from "@/components/campaign/share-x-button";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { CommentButton } from "@/components/campaign/comment-button";
import { StreakBadge } from "@/components/billboard/streak-badge";
import { ClickCount } from "@/components/campaign/click-count";
import { PaidAmount } from "@/components/billboard/paid-amount";
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
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/campaign/${campaign.slug}`}
          className="truncate text-sm font-semibold transition-colors hover:text-hero-pink hover:underline"
        >
          {campaign.name}
        </Link>
        {/*
          A phone row has no width to spare beside the name - dropping the
          money in next to it starves the name down to a character or two.
          Under the name it costs a few pixels of height instead, and only on
          the rows that have actually taken money.
        */}
        <PaidAmount paidPower={campaign.paid_power} className="mt-0.5 self-start sm:hidden" />
      </div>
      {campaign.has_been_goat && <GoatBadge size="xs" className="shrink-0" />}
      {campaign.held_24h_at && <StreakBadge size="xs" className="shrink-0" />}
      <ClickCount count={campaign.click_count} className="hidden shrink-0 text-xs sm:inline-flex" />
      <PaidAmount paidPower={campaign.paid_power} className="hidden shrink-0 sm:inline-flex" />
      <span className="shrink-0 text-sm font-bold tabular-nums">
        {formatPower(campaign.total_power)}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <CommentButton
          slug={campaign.slug}
          count={campaign.comment_count}
          size="sm"
          className="hidden sm:inline-flex"
        />
        <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" compact />
        <BoostButton
          campaignId={campaign.id}
          campaignName={campaign.name}
          size="sm"
          variant="outline"
          compact
        />
        <ShareXButton
          slug={campaign.slug}
          name={campaign.name}
          rank={rank}
          totalPower={campaign.total_power}
          size="sm"
          variant="outline"
          compact
        />
      </div>
    </div>
  );
}
