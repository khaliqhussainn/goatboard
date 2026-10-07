import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_DEFINITIONS, isAchievementType } from "@/lib/achievements";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function badgeSvg(type: keyof typeof ACHIEVEMENT_DEFINITIONS): string {
  const badge = ACHIEVEMENT_DEFINITIONS[type];
  const variants = {
    launched: {
      background: "#fcfaff",
      border: "#b88cff",
      wave: "#b372f2",
      primary: "#28285f",
      secondary: "#85859d",
      eyebrow: "LAUNCHED ON",
      headline: "goatboard",
      headlineSize: 25,
      eyebrowX: 78,
      accent: "#9b63e8",
    },
    top_3: {
      background: "#fffaf0",
      border: "#f0c554",
      wave: "#ffbd2e",
      primary: "#252956",
      secondary: "#777786",
      eyebrow: "TOP 3",
      headline: "ON GOATBOARD",
      headlineSize: 13,
      eyebrowX: 78,
      accent: "#f3b91e",
    },
    goat_of_week: {
      background: "#24174f",
      border: "#9e6bf4",
      wave: "#8654db",
      primary: "#ffffff",
      secondary: "#c096ff",
      eyebrow: "GOAT",
      headline: "OF THE WEEK",
      headlineSize: 16,
      eyebrowX: 78,
      accent: "#b77cff",
    },
    trending: {
      background: "#f2fffb",
      border: "#50bfa0",
      wave: "#39b995",
      primary: "#173e39",
      secondary: "#548078",
      eyebrow: "TRENDING",
      headline: "ON GOATBOARD",
      headlineSize: 14,
      eyebrowX: 78,
      accent: "#38b894",
    },
  } as const;
  const variant = variants[type];
  const isTopThree = type === "top_3";
  const isGoatOfWeek = type === "goat_of_week";
  const headlineY = isTopThree || isGoatOfWeek ? 56 : 53;
  const eyebrowSize = isTopThree || isGoatOfWeek ? 25 : 12;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72" role="img" aria-labelledby="title description">
  <title id="title">${badge.label}</title>
  <desc id="description">Verified GoatBoard achievement badge</desc>
  <defs>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffba16"/><stop offset=".28" stop-color="#283878"/>
      <stop offset=".57" stop-color="#38b99b"/><stop offset="1" stop-color="#a96ff1"/>
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${variant.wave}" stop-opacity=".15"/>
      <stop offset="1" stop-color="${variant.wave}" stop-opacity=".78"/>
    </linearGradient>
    <clipPath id="frame"><rect x="1" y="1" width="318" height="70" rx="21"/></clipPath>
  </defs>
  <rect x="1" y="1" width="318" height="70" rx="21" fill="${variant.background}" stroke="${variant.border}" stroke-width="2"/>
  <g clip-path="url(#frame)">
    <path d="M210 73c30-18 59-6 111-31v31z" fill="url(#wave)"/>
    <path d="M244 73c25-12 48-11 78-28v28z" fill="${variant.wave}" fill-opacity=".22"/>
  </g>
  <g transform="translate(15 9)">
    <path d="M12 16C4 12 2 4 7 2c5-2 9 4 11 10M44 16c8-4 10-12 5-14-5-2-9 4-11 10" fill="none" stroke="url(#mark)" stroke-width="7" stroke-linecap="round"/>
    <path d="M12 20c0-8 7-14 16-14s16 6 16 14v17c0 11-8 17-17 17-10 0-17-6-17-16 0-8 5-13 13-13 6 0 10 4 10 9 0 4-3 7-7 7-3 0-5-2-5-5" fill="none" stroke="url(#mark)" stroke-width="9" stroke-linecap="round"/>
    <circle cx="27" cy="22" r="5.5" fill="${variant.background}"/>
    <path d="M18 49c5 4 12 4 17-1" fill="none" stroke="${variant.primary}" stroke-width="2" stroke-linecap="round" opacity=".75"/>
  </g>
  <text x="${variant.eyebrowX}" y="${isTopThree || isGoatOfWeek ? 36 : 28}" fill="${variant.primary}" font-family="Figtree,Arial,sans-serif" font-size="${eyebrowSize}" font-weight="900" letter-spacing="${isTopThree || isGoatOfWeek ? 1 : 2}">${variant.eyebrow}</text>
  <text x="78" y="${headlineY}" fill="${isTopThree ? variant.secondary : isGoatOfWeek ? variant.secondary : variant.primary}" font-family="Figtree,Arial,sans-serif" font-size="${variant.headlineSize}" font-weight="850" letter-spacing="${isTopThree || isGoatOfWeek || type === "trending" ? 1.4 : -.3}">${variant.headline}</text>
  ${isTopThree ? '<path d="M280 14l5 7 8-3-2 9 7 5-9 1-4 8-4-8-9-1 7-5-2-9 8 3z" fill="#f4b91d"/><path d="M275 44h20" stroke="#f4b91d" stroke-width="2" stroke-linecap="round"/>' : ""}
  ${isGoatOfWeek ? '<path d="M291 15l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#c595ff"/><path d="M304 36l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffffff" opacity=".8"/>' : ""}
  ${type === "launched" ? '<path d="M286 19l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#a96ff1"/><path d="M301 25l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill="#c49aff"/>' : ""}
  ${type === "trending" ? '<path d="M278 43l8-9 7 5 11-15" fill="none" stroke="#38b894" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M299 24h5v5" fill="none" stroke="#38b894" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' : ""}
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
