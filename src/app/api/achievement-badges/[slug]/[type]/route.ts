import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_DEFINITIONS, isAchievementType } from "@/lib/achievements";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function badgeSvg(type: keyof typeof ACHIEVEMENT_DEFINITIONS): string {
  const badge = ACHIEVEMENT_DEFINITIONS[type];
  const copy = {
    launched: {
      eyebrow: "LAUNCHED ON",
      headline: "goatboard",
      headlineSize: 25,
    },
    top_3: {
      eyebrow: "TOP 3",
      headline: "ON GOATBOARD",
      headlineSize: 13,
    },
    goat_of_week: {
      eyebrow: "GOAT",
      headline: "OF THE WEEK",
      headlineSize: 16,
    },
    trending: {
      eyebrow: "TRENDING",
      headline: "ON GOATBOARD",
      headlineSize: 14,
    },
  } as const;
  const text = copy[type];
  const isTopThree = type === "top_3";
  const isGoatOfWeek = type === "goat_of_week";
  const headlineY = isTopThree || isGoatOfWeek ? 56 : 53;
  const eyebrowSize = isTopThree || isGoatOfWeek ? 25 : 12;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72" role="img" aria-labelledby="title description">
  <title id="title">${badge.label}</title>
  <desc id="description">Verified GoatBoard achievement badge</desc>
  <rect x="1" y="1" width="318" height="70" rx="18" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <!-- Self-contained monochrome version of the horned GoatBoard g mark.
       Keeping it inline avoids the broken nested-image behavior of SVGs
       displayed through an img element and keeps the badge under 3 KB. -->
  <g transform="translate(10 7)" fill="#111111">
    <path d="M17 17C8 17 3 11 5 5c2-5 8-4 11 0 2 3 3 7 3 12h-2z"/>
    <path d="M41 17c9 0 14-6 12-12-2-5-8-4-11 0-2 3-3 7-3 12h2z"/>
    <path fill-rule="evenodd" d="M29 9c13 0 22 9 22 21 0 6-2 11-5 15-1 10-8 16-19 16-8 0-15-3-17-8-2-4 1-8 5-8 3 0 6 3 10 3 5 0 8-2 10-6-2 1-5 2-8 2C15 44 7 36 7 26 7 16 16 9 29 9zm0 13a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
    <path d="M17 51c7 5 16 5 23-1-2 8-8 12-15 12-5 0-9-2-11-5-2-3 0-7 3-6z"/>
  </g>
  <text x="76" y="${isTopThree || isGoatOfWeek ? 36 : 28}" fill="#111111" font-family="Arial,sans-serif" font-size="${eyebrowSize}" font-weight="900" letter-spacing="${isTopThree || isGoatOfWeek ? 1 : 2}">${text.eyebrow}</text>
  <text x="76" y="${headlineY}" fill="#111111" font-family="Arial,sans-serif" font-size="${text.headlineSize}" font-weight="800" letter-spacing="${isTopThree || isGoatOfWeek || type === "trending" ? 1.4 : -.3}">${text.headline}</text>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; type: string }> },
) {
  const { slug, type } = await params;
  if (!isAchievementType(type)) {
    return new Response("Badge not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!campaign) return new Response("Badge not found", { status: 404 });

  const { data: achievement } = await admin
    .from("campaign_achievements")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("achievement_type", type)
    .limit(1)
    .maybeSingle();

  if (!achievement) return new Response("Badge not found", { status: 404 });

  const ip = getClientIp(request.headers);
  const allowed = rateLimit(`achievement-view:${ip}:${achievement.id}`, {
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  const isInternalPreview = new URL(request.url).searchParams.get("preview") === "1";
  if (allowed.success && !isInternalPreview) {
    const { error } = await admin.rpc("record_campaign_achievement_view", {
      p_campaign_id: campaign.id,
      p_achievement_type: type,
    });
    if (error) console.error("achievement badge view tracking failed", error);
  }

  return new Response(badgeSvg(type), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
