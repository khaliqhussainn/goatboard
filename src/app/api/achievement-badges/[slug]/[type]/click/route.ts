import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAchievementType } from "@/lib/achievements";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; type: string }> },
) {
  const { slug, type } = await params;
  const fallback = new URL("/", getSiteUrl(request.url));
  if (!isAchievementType(type)) return NextResponse.redirect(fallback);

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!campaign) return NextResponse.redirect(fallback);

  const { data: achievement } = await admin
    .from("campaign_achievements")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("achievement_type", type)
    .limit(1)
    .maybeSingle();

  if (!achievement) return NextResponse.redirect(fallback);

  const ip = getClientIp(request.headers);
  const allowed = rateLimit(`achievement-click:${ip}:${achievement.id}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (allowed.success) {
    const { error } = await admin.rpc("record_campaign_achievement_click", {
      p_campaign_id: campaign.id,
      p_achievement_type: type,
    });
    if (error) console.error("achievement badge click tracking failed", error);
  }

  const destination = new URL(`/campaign/${encodeURIComponent(campaign.slug)}`, getSiteUrl(request.url));
  destination.searchParams.set("utm_source", "achievement_badge");
  destination.searchParams.set("utm_medium", "embed");
  destination.searchParams.set("utm_campaign", type);
  return NextResponse.redirect(destination);
}
