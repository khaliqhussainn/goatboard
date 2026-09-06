import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CampaignHeroImage } from "@/components/campaign/campaign-hero-image";
import { RankChip } from "@/components/billboard/rank-chip";
import { GoatMascot } from "@/components/billboard/goat-mascot";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { powerBreakdown, hostnameOf } from "@/lib/utils";
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
        <CampaignHeroImage src={campaign.image_url} name={campaign.name} className="size-full" />
        <RankChip rank={rank} className="absolute left-2 top-2 px-2 py-0.5 text-xs" />
        <GoatMascot seed={campaign.id} className="absolute -bottom-1 -right-1 size-10 rotate-3" />
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
          className="truncate font-bold hover:underline"
        >
          {campaign.name}
        </Link>

        <p className="line-clamp-1 text-xs text-muted-foreground">{campaign.description}</p>

        <a
          href={campaign.destination_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {hostnameOf(campaign.destination_url)}
          <ExternalLink className="size-3" />
        </a>

        <PowerDisplay power={campaign.total_power} size="lg" className="mt-1" />
        <p className="text-xs text-muted-foreground">
          {powerBreakdown(campaign.paid_power, campaign.vote_power)}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <VoteButton campaignId={campaign.id} onVoted={onVoted} size="sm" />
        </div>
      </div>
    </div>
  );
}
