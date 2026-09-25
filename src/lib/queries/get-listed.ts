import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import type { GetListedCampaign, GetListedOrder, GetListedSubmission } from "@/lib/types";

/**
 * Reads for the Get Listed service.
 *
 * Ownership is enforced here, in the query, rather than by RLS: the owner is
 * an anonymous cookie value that Postgres has no concept of, so there is no
 * database role to write a policy against. Every function that returns a
 * campaign takes the viewer's id and filters on it, so an id guessed or typed
 * into the URL returns nothing rather than someone else's campaign.
 */

export type GetListedCampaignDetail = {
  campaign: GetListedCampaign;
  order: GetListedOrder | null;
  submissions: GetListedSubmission[];
};

/** Every campaign belonging to the current visitor, newest first. */
export async function listMyGetListedCampaigns(): Promise<
  { campaign: GetListedCampaign; order: GetListedOrder | null; submissions: { status: GetListedSubmission["status"] }[] }[]
> {
  const ownerId = await getVisitorId();
  if (!ownerId) return [];

  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from("get_listed_campaigns")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !campaigns?.length) {
    if (error) console.error("get_listed campaigns list failed", error);
    return [];
  }

  const ids = campaigns.map((c) => c.id);
  const [{ data: orders }, { data: submissions }] = await Promise.all([
    admin.from("get_listed_orders").select("*").in("campaign_id", ids),
    admin
      .from("get_listed_submissions")
      .select("campaign_id, status")
      .in("campaign_id", ids)
      .eq("visible_to_client", true),
  ]);

  return campaigns.map((campaign) => ({
    campaign,
    // Newest order wins if a campaign was retried through checkout.
    order:
      (orders ?? [])
        .filter((o) => o.campaign_id === campaign.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    submissions: (submissions ?? []).filter(
      (s) => (s as { campaign_id: string }).campaign_id === campaign.id,
    ),
  }));
}

/**
 * One campaign, only if the current visitor owns it. Returns null for both
 * "no such campaign" and "not yours" so the two are indistinguishable to a
 * caller poking at ids.
 */
export async function getMyGetListedCampaign(
  campaignId: string,
): Promise<GetListedCampaignDetail | null> {
  const ownerId = await getVisitorId();
  if (!ownerId) return null;

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("get_listed_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!campaign) return null;

  const [{ data: orders }, { data: submissions }] = await Promise.all([
    admin
      .from("get_listed_orders")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false }),
    admin
      .from("get_listed_submissions")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: true }),
  ]);

  return {
    campaign,
    order: orders?.[0] ?? null,
    submissions: submissions ?? [],
  };
}

/** Admin-only: every campaign, with its order and submission rows. */
export async function listAllGetListedCampaigns(): Promise<
  { campaign: GetListedCampaign; order: GetListedOrder | null; submissions: GetListedSubmission[] }[]
> {
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from("get_listed_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !campaigns?.length) {
    if (error) console.error("admin get_listed campaigns list failed", error);
    return [];
  }

  const ids = campaigns.map((c) => c.id);
  const [{ data: orders }, { data: submissions }] = await Promise.all([
    admin.from("get_listed_orders").select("*").in("campaign_id", ids),
    admin.from("get_listed_submissions").select("*").in("campaign_id", ids),
  ]);

  return campaigns.map((campaign) => ({
    campaign,
    order:
      (orders ?? [])
        .filter((o) => o.campaign_id === campaign.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    submissions: (submissions ?? [])
      .filter((s) => s.campaign_id === campaign.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}
