import { notFound } from "next/navigation";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { ShareButton } from "@/components/campaign/share-button";
import { ReportButton } from "@/components/campaign/report-button";
import { DestinationLink } from "@/components/campaign/destination-link";
import { ClickCount } from "@/components/campaign/click-count";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatMoney, ordinal, getSiteUrl } from "@/lib/utils";
import { getCampaignBySlug, getCampaignRank } from "@/lib/queries/campaign";

export async function CampaignDetail({ slug }: { slug: string }) {
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const rank = await getCampaignRank(campaign);
  const dollars = Math.round(campaign.paid_power / 3);
  const url = `${getSiteUrl()}/campaign/${campaign.slug}`;

  return (
    <div className="billboard-surface flex flex-col items-center gap-6 p-6 text-center sm:p-10">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {ordinal(rank)} on GOATBOARD
      </span>

      <CampaignAvatar
        src={campaign.image_url}
        name={campaign.name}
        className="size-28 text-4xl"
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{campaign.name}</h1>
        <Badge variant={categoryAccent(campaign.category)}>
          {categoryLabel(campaign.category)}
        </Badge>
      </div>

      <PowerDisplay power={campaign.total_power} size="xl" />
      <p className="text-sm text-muted-foreground">
        {formatMoney(dollars)} · {campaign.vote_power.toLocaleString("en-US")} votes
      </p>

      <p className="max-w-md text-sm text-muted-foreground">{campaign.description}</p>

      <div className="flex flex-col items-center gap-1">
        <DestinationLink
          campaignId={campaign.id}
          url={campaign.destination_url}
          className="text-sm underline underline-offset-4"
        />
        <ClickCount count={campaign.click_count} className="text-xs" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <VoteButton campaignId={campaign.id} size="lg" />
        <BoostButton campaignId={campaign.id} campaignName={campaign.name} size="lg" />
        <ShareButton
          url={url}
          title={`${campaign.name} on GOATBOARD`}
          text={`#${rank} on GOATBOARD - ${campaign.name} has ${campaign.total_power} Power.`}
        />
      </div>

      <ReportButton campaignId={campaign.id} />
    </div>
  );
}
