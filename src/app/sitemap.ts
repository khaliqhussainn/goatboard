import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  let campaignEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    campaignEntries = (campaigns ?? []).map((campaign) => ({
      url: `${siteUrl}/campaign/${campaign.slug}`,
      lastModified: campaign.updated_at,
      changeFrequency: "hourly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap campaign lookup failed", error);
  }

  return [
    { url: siteUrl, changeFrequency: "always", priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/create`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/get-listed`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/roast`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    ...campaignEntries,
  ];
}
