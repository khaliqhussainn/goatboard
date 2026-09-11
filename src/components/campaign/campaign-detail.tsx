import { notFound } from "next/navigation";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { ShareButton } from "@/components/campaign/share-button";
import { ReportButton } from "@/components/campaign/report-button";
import { DestinationLink } from "@/components/campaign/destination-link";
import { XHandleLink } from "@/components/campaign/x-handle-link";
import { ClickCount } from "@/components/campaign/click-count";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatMoney, ordinal, getSiteUrl, cn } from "@/lib/utils";
import { getCampaignBySlug, getCampaignRank } from "@/lib/queries/campaign";

export async function CampaignDetail({
  slug,
  compact = false,
}: {
  slug: string;
  /** Clamps the description so the card fits a modal viewport without scrolling. */
  compact?: boolean;
}) {
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const rank = await getCampaignRank(campaign);
  const dollars = Math.round(campaign.paid_power / 3);
  const url = `${getSiteUrl()}/campaign/${campaign.slug}`;

  return (
    <div className="billboard-surface flex flex-col gap-5 rounded-[1.75rem] p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <CampaignAvatar
          src={campaign.image_url}
          name={campaign.name}
          className="size-20 shrink-0 rounded-2xl text-2xl sm:size-24"
        />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {ordinal(rank)} on GOATBOARD
          </span>
          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
            {campaign.name}
          </h1>
          <Badge variant={categoryAccent(campaign.category)} className="mt-1">
            {categoryLabel(campaign.category)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-muted/60 px-4 py-3">
        <PowerDisplay power={campaign.total_power} size="lg" />
        <span className="text-sm text-muted-foreground">
          {formatMoney(dollars)} · {campaign.vote_power.toLocaleString("en-US")} votes
        </span>
      </div>

      <p className={cn("text-sm text-muted-foreground", compact && "line-clamp-3")}>
        {campaign.description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <DestinationLink
            campaignId={campaign.id}
            url={campaign.destination_url}
            className="underline underline-offset-4"
          />
          {campaign.x_handle && <XHandleLink handle={campaign.x_handle} />}
        </div>
        <ClickCount count={campaign.click_count} className="text-xs" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <VoteButton campaignId={campaign.id} size="lg" compact />
        <BoostButton campaignId={campaign.id} campaignName={campaign.name} size="lg" compact />
        <ShareButton
          url={url}
          title={`${campaign.name} on GOATBOARD`}
          text={`#${rank} on GOATBOARD - ${campaign.name} has ${campaign.total_power} Power.`}
          size="lg"
          compact
        />
      </div>

      <ReportButton campaignId={campaign.id} />
    </div>
  );
}
