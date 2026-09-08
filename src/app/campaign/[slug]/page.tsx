import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { PaymentConfirmation } from "@/components/campaign/payment-confirmation";
import { CampaignDetail } from "@/components/campaign/campaign-detail";
import { getCampaignBySlug, getCampaignRank } from "@/lib/queries/campaign";
import { getSiteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return {};

  const title = `${campaign.name} - #${await getCampaignRank(campaign)} on GOATBOARD`;
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
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const url = `${getSiteUrl()}/campaign/${campaign.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: campaign.name,
    description: campaign.description,
    url,
    image: campaign.image_url ?? undefined,
  };

  return (
    <div className="on-backdrop mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <Suspense fallback={null}>
        <PaymentConfirmation />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CampaignDetail slug={slug} />
    </div>
  );
}
