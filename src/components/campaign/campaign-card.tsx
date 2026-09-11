import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Badge } from "@/components/ui/badge";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatPower } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function CampaignCard({ campaign, rank }: { campaign: Campaign; rank: number }) {
  return (
    <Link
      href={`/campaign/${campaign.slug}`}
      className="billboard-surface flex flex-col gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <CampaignAvatar src={campaign.image_url} name={campaign.name} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{campaign.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <Badge variant={categoryAccent(campaign.category)}>
              {categoryLabel(campaign.category)}
            </Badge>
            {campaign.has_been_goat && <GoatBadge size="xs" />}
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-muted-foreground">#{rank}</span>
      </div>
      <p className="line-clamp-2 wrap-break-word text-sm text-muted-foreground">
        {campaign.description}
      </p>
      <p className="text-lg font-black tabular-nums">{formatPower(campaign.total_power)} Power</p>
    </Link>
  );
}
