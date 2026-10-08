import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicRant, RantCategory, RantProduct } from "@/lib/rants";

export async function getRants(visitorId: string | null): Promise<PublicRant[]> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("rants")
    .select("id, body, category, same_count, reply_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!rows?.length) return [];

  const rantIds = rows.map((rant) => rant.id);
  const [solutionResult, replySuggestionResult, reactionResult] = await Promise.all([
    admin.from("rant_solutions").select("rant_id, campaign_id").in("rant_id", rantIds),
    admin
      .from("rant_replies")
      .select("rant_id, suggested_campaign_id")
      .in("rant_id", rantIds)
      .not("suggested_campaign_id", "is", null),
    visitorId
      ? admin
          .from("rant_same_reactions")
          .select("rant_id")
          .eq("visitor_id", visitorId)
          .in("rant_id", rantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (solutionResult.error) throw solutionResult.error;
  if (replySuggestionResult.error) throw replySuggestionResult.error;
  if (reactionResult.error) throw reactionResult.error;

  const productLinks = [
    ...(solutionResult.data ?? []).map((item) => ({
      rantId: item.rant_id,
      campaignId: item.campaign_id,
    })),
    ...(replySuggestionResult.data ?? []).flatMap((item) =>
      item.suggested_campaign_id
        ? [{ rantId: item.rant_id, campaignId: item.suggested_campaign_id }]
        : [],
    ),
  ];
  const campaignIds = [...new Set(productLinks.map((item) => item.campaignId))];
  const campaignsById = new Map<string, RantProduct>();

  if (campaignIds.length > 0) {
    const { data: campaigns, error: campaignError } = await admin
      .from("campaigns")
      .select("id, name, slug, image_url")
      .eq("status", "active")
      .in("id", campaignIds);

    if (campaignError) throw campaignError;
    for (const campaign of campaigns ?? []) {
      campaignsById.set(campaign.id, {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        imageUrl: campaign.image_url,
        href: `/campaign/${campaign.slug}`,
      });
    }
  }

  const productsByRant = new Map<string, Map<string, RantProduct>>();
  for (const link of productLinks) {
    const product = campaignsById.get(link.campaignId);
    if (!product) continue;
    const products = productsByRant.get(link.rantId) ?? new Map<string, RantProduct>();
    products.set(product.id, product);
    productsByRant.set(link.rantId, products);
  }

  const reactedIds = new Set((reactionResult.data ?? []).map((reaction) => reaction.rant_id));

  return rows.map((rant) => ({
    id: rant.id,
    body: rant.body,
    category: rant.category as RantCategory,
    sameCount: rant.same_count,
    replies: rant.reply_count,
    didSame: reactedIds.has(rant.id),
    products: [...(productsByRant.get(rant.id)?.values() ?? [])],
    createdAt: rant.created_at,
  }));
}
