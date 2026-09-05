import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const campaignEntries: MetadataRoute.Sitemap = (campaigns ?? []).map((c) => ({
    url: `${siteUrl}/campaign/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [
    { url: siteUrl, changeFrequency: "always", priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/create`, changeFrequency: "monthly", priority: 0.5 },
    ...campaignEntries,
  ];
}
