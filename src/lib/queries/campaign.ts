import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Campaign, CampaignComment, WeeklyVoteLeader } from "@/lib/types";

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

/** Top three active campaigns by votes cast during the rolling last seven
 * days. This deliberately does not read campaign.vote_power or paid Power. */
export async function getWeeklyVoteLeaders(): Promise<WeeklyVoteLeader[]> {
  const supabase = await createClient();
  const { data: leaders, error } = await supabase.rpc("get_weekly_vote_leaders");

  if (error || !leaders?.length) {
    if (error) console.error("weekly vote leaders read failed", error);
    return [];
  }

  const ids = leaders.map((leader) => leader.campaign_id);
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .in("id", ids)
    .eq("status", "active");

  if (campaignsError) {
    console.error("weekly vote leader campaigns read failed", campaignsError);
    return [];
  }

  const campaignsById = new Map((campaigns ?? []).map((campaign) => [campaign.id, campaign]));
  return leaders.flatMap((leader) => {
    const campaign = campaignsById.get(leader.campaign_id);
    return campaign ? [{ campaign, voteCount: Number(leader.vote_count) }] : [];
  });
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
