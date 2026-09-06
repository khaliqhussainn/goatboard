import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { PowerDisplay } from "@/components/billboard/power-display";
import { VoteButton } from "@/components/billboard/vote-button";
import { BoostButton } from "@/components/billboard/boost-button";
import { ShareButton } from "@/components/campaign/share-button";
import { ReportButton } from "@/components/campaign/report-button";
import { DestinationLink } from "@/components/campaign/destination-link";
import { ClickCount } from "@/components/campaign/click-count";
import { PaymentConfirmation } from "@/components/campaign/payment-confirmation";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatMoney, ordinal, getSiteUrl } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

async function getCampaign(slug: string): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

async function getRank(campaign: Campaign): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .or(
      `total_power.gt.${campaign.total_power},and(total_power.eq.${campaign.total_power},updated_at.lt.${campaign.updated_at})`,
    );
  return (count ?? 0) + 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};

  const title = `${campaign.name} - #${await getRank(campaign)} on GOATBOARD`;
  const description = campaign.description;

  return {
    title,
    description,
    alternates: { canonical: `/campaign/${campaign.slug}` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const rank = await getRank(campaign);
  const dollars = Math.round(campaign.paid_power / 3);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/campaign/${campaign.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: campaign.name,
    description: campaign.description,
    url,
    image: campaign.image_url ?? undefined,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <Suspense fallback={null}>
        <PaymentConfirmation />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
    </div>
  );
}
