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
  dense = false,
}: {
  campaign: Campaign;
  rank: number;
  onVoted?: (totalPower: number) => void;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "billboard-surface-sm flex items-center rounded-xl",
        dense ? "gap-2 px-2.5 py-2" : "gap-3 px-3 py-2.5 sm:px-4",
      )}
    >
      <span
        className={cn(
          "shrink-0 font-bold tabular-nums text-muted-foreground",
          dense ? "w-6 text-xs" : "w-7 text-sm",
        )}
      >
        #{rank}
      </span>
      <Link href={`/campaign/${campaign.slug}`} className="shrink-0">
        <CampaignAvatar
          src={campaign.image_url}
          name={campaign.name}
          className={dense ? "size-7 rounded-lg text-[10px]" : "size-8"}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/campaign/${campaign.slug}`}
          className="truncate text-sm font-semibold transition-colors hover:text-hero-pink hover:underline"
        >
          {campaign.name}
        </Link>
        {dense && <ClickCount count={campaign.click_count} className="text-[10px] leading-none" />}
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
      {!dense && (
        <ClickCount count={campaign.click_count} className="hidden shrink-0 text-xs sm:inline-flex" />
      )}
      <PaidAmount
        paidPower={campaign.paid_power}
        className={cn("hidden shrink-0", dense ? "2xl:inline-flex" : "sm:inline-flex")}
      />
      <span className={cn("shrink-0 font-bold tabular-nums", dense ? "text-xs" : "text-sm")}>
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
        {!dense && (
          <ShareXButton
            slug={campaign.slug}
            name={campaign.name}
            rank={rank}
            totalPower={campaign.total_power}
            size="sm"
            variant="outline"
            compact
          />
        )}
      </div>
    </div>
  );
}
