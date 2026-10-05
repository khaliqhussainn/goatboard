import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";

const idSchema = z.string().uuid();
const solutionSchema = z.object({ campaignId: z.string().uuid() });

export async function POST(request: Request, context: RouteContext<"/api/rants/[id]/solutions">) {
  const visitorId = await getVisitorId();
  if (!visitorId) return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });

  const { id } = await context.params;
  const parsed = solutionSchema.safeParse(await request.json().catch(() => null));
  if (!idSchema.safeParse(id).success || !parsed.success) {
    return NextResponse.json({ message: "Invalid product match." }, { status: 400 });
  }

  const visitorLimit = rateLimit(`rant-solution:${visitorId}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  const ipLimit = rateLimit(`rant-solution-ip:${getClientIp(request.headers)}`, { limit: 40, windowMs: 60 * 60 * 1000 });
  if (!visitorLimit.success || !ipLimit.success) {
    return NextResponse.json({ message: "Too many product matches. Try again later." }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const [{ data: rant }, { data: campaign }] = await Promise.all([
      admin.from("rants").select("id").eq("id", id).maybeSingle(),
      admin
        .from("campaigns")
        .select("id, name, slug, image_url, created_by")
        .eq("id", parsed.data.campaignId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (!rant) return NextResponse.json({ message: "Rant not found." }, { status: 404 });
    if (!campaign || campaign.created_by !== visitorId) {
      return NextResponse.json({ message: "You can only connect a product you own." }, { status: 403 });
    }

    const { error } = await admin.from("rant_solutions").upsert(
      { rant_id: id, campaign_id: campaign.id, owner_id: visitorId },
      { onConflict: "rant_id,campaign_id", ignoreDuplicates: true },
    );
    if (error) throw error;

    return NextResponse.json({
      product: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        imageUrl: campaign.image_url,
        href: `/campaign/${campaign.slug}`,
      },
    });
  } catch (error) {
    console.error("rant solution attach failed", error);
    return NextResponse.json({ message: "Couldn't connect that product." }, { status: 500 });
  }
}
