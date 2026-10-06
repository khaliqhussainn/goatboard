import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { xHandleSchema } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";

const idSchema = z.string().uuid();
const replySchema = z.object({
  authorXHandle: xHandleSchema,
  body: z.string().trim().min(1, "Write a reply first.").max(500),
  parentId: z.string().uuid().nullable().optional(),
  suggestedCampaignId: z.string().uuid().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const visitorId = await getVisitorId();
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ message: "Invalid rant." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: rant } = await admin.from("rants").select("id").eq("id", id).maybeSingle();
    if (!rant) return NextResponse.json({ message: "Rant not found." }, { status: 404 });

    const { data, error } = await admin
      .from("rant_replies")
      .select("id, parent_id, body, author_id, author_x_handle, suggested_campaign_id, created_at")
      .eq("rant_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const campaignIds = [
      ...new Set((data ?? []).flatMap((reply) => reply.suggested_campaign_id ? [reply.suggested_campaign_id] : [])),
    ];
    const campaignsById = new Map<
      string,
      { id: string; name: string; slug: string; imageUrl: string | null; href: string }
    >();
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

    return NextResponse.json({
      replies: (data ?? []).map((reply) => ({
        id: reply.id,
        parentId: reply.parent_id,
        body: reply.body,
        authorXHandle: reply.author_x_handle,
        suggestedProduct: reply.suggested_campaign_id
          ? (campaignsById.get(reply.suggested_campaign_id) ?? null)
          : null,
        isMine: Boolean(visitorId && reply.author_id === visitorId),
        createdAt: reply.created_at,
      })),
    });
  } catch (error) {
    console.error("rant replies read failed", error);
    return NextResponse.json({ message: "Couldn't load the replies." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const visitorId = await getVisitorId();
  if (!visitorId) return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });

  const { id } = await context.params;
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!idSchema.safeParse(id).success || !parsed.success) {
    return NextResponse.json(
      { message: parsed.success ? "Invalid rant." : (parsed.error.issues[0]?.message ?? "Invalid reply.") },
      { status: 400 },
    );
  }

  const visitorLimit = rateLimit(`rant-reply:${visitorId}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  const ipLimit = rateLimit(`rant-reply-ip:${getClientIp(request.headers)}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!visitorLimit.success || !ipLimit.success) {
    return NextResponse.json({ message: "You're replying too quickly. Try again shortly." }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { data: rant } = await admin.from("rants").select("id").eq("id", id).maybeSingle();
    if (!rant) return NextResponse.json({ message: "Rant not found." }, { status: 404 });

    let parentId: string | null = null;
    if (parsed.data.parentId) {
      const { data: parent } = await admin
        .from("rant_replies")
        .select("id, parent_id")
        .eq("id", parsed.data.parentId)
        .eq("rant_id", id)
        .maybeSingle();
      if (!parent) return NextResponse.json({ message: "That reply no longer exists." }, { status: 404 });
      parentId = parent.parent_id ?? parent.id;
    }

    let suggestedProduct: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string | null;
      href: string;
    } | null = null;
    if (parsed.data.suggestedCampaignId) {
      const { data: campaign } = await admin
        .from("campaigns")
        .select("id, name, slug, image_url")
        .eq("id", parsed.data.suggestedCampaignId)
        .eq("status", "active")
        .maybeSingle();
      if (!campaign) {
        return NextResponse.json({ message: "That product is no longer listed." }, { status: 404 });
      }
      suggestedProduct = {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        imageUrl: campaign.image_url,
        href: `/campaign/${campaign.slug}`,
      };
    }

    const { data, error } = await admin
      .from("rant_replies")
      .insert({
        rant_id: id,
        author_id: visitorId,
        author_x_handle: parsed.data.authorXHandle,
        parent_id: parentId,
        suggested_campaign_id: parsed.data.suggestedCampaignId ?? null,
        body: parsed.data.body,
      })
      .select("id, parent_id, body, created_at")
      .single();
    if (error || !data) throw error;

    const { data: updatedRant } = await admin
      .from("rants")
      .select("reply_count")
      .eq("id", id)
      .single();

    return NextResponse.json(
      {
        reply: {
          id: data.id,
          parentId: data.parent_id,
          body: data.body,
          authorXHandle: parsed.data.authorXHandle,
          suggestedProduct,
          isMine: true,
          createdAt: data.created_at,
        },
        replyCount: updatedRant?.reply_count ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("rant reply creation failed", error);
    return NextResponse.json({ message: "Couldn't post your reply." }, { status: 500 });
  }
}
