import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Campaign, CampaignComment } from "@/lib/types";

// Cached per-request so the full page (generateMetadata + the page itself)
// and the intercepted modal route can all resolve the same slug without
// issuing duplicate Supabase queries.
export const getCampaignBySlug = cache(async (slug: string): Promise<Campaign | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
});

export async function getCampaignRank(campaign: Campaign): Promise<number> {
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

/**
 * Comments on a campaign, newest first.
 *
 * Uses the same anon client as everything else here rather than the service
 * role: campaign_comments has a public select policy, so reading them needs
 * no elevation. Writes are the elevated half, and they live in /api/comments.
 */
export async function getCampaignComments(campaignId: string): Promise<CampaignComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_comments")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("campaign comments read failed", error);
    return [];
  }
  return data ?? [];
}
