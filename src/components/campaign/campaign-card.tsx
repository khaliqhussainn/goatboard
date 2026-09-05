import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatPower } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function CampaignCard({ campaign, rank }: { campaign: Campaign; rank: number }) {
  return (
    <Link
      href={`/campaign/${campaign.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <CampaignAvatar src={campaign.image_url} name={campaign.name} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{campaign.name}</p>
          <Badge variant={categoryAccent(campaign.category)} className="mt-0.5">
            {categoryLabel(campaign.category)}
          </Badge>
        </div>
        <span className="shrink-0 text-xs font-bold text-muted-foreground">#{rank}</span>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.description}</p>
      <p className="text-lg font-black tabular-nums">{formatPower(campaign.total_power)} Power</p>
    </Link>
  );
}
