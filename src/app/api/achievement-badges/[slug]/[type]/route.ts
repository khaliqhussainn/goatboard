import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_DEFINITIONS, isAchievementType } from "@/lib/achievements";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function badgeSvg(type: keyof typeof ACHIEVEMENT_DEFINITIONS): string {
  const badge = ACHIEVEMENT_DEFINITIONS[type];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72" role="img" aria-labelledby="title description">
  <title id="title">${badge.label}</title>
  <desc id="description">Verified GoatBoard achievement badge</desc>
  <rect x="1" y="1" width="318" height="70" rx="18" fill="${badge.background}" stroke="#111111" stroke-width="2"/>
  <g transform="translate(12 8)">
    <circle cx="28" cy="28" r="27" fill="#ffffff" stroke="#111111" stroke-width="1.5"/>
    <path d="M12 23C4 18 3 9 8 7c5-2 9 4 11 10M44 23c8-5 9-14 4-16-5-2-9 4-11 10" fill="#f1c9b8" stroke="#111111" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 13C13 5 16 0 22 5M38 13c5-8 2-13-4-8" fill="none" stroke="#8a5a3b" stroke-width="4" stroke-linecap="round"/>
    <path d="M13 13l5-8 6 6 6-8 6 8 7-6 2 10" fill="${badge.accent}" stroke="#111111" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 25c0-8 6-14 14-14s14 6 14 14v13c0 9-6 15-14 15S14 47 14 38V25z" fill="#ffffff"/>
    <path d="M15 27h11l2 5 2-5h11" fill="#111111" stroke="#111111" stroke-width="5" stroke-linecap="round"/>
    <path d="M27 38c1 2 3 2 4 0M23 44c3 3 7 3 10 0" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <text x="78" y="27" fill="#5f6368" font-family="Figtree,Arial,sans-serif" font-size="11" font-weight="800" letter-spacing="1.7">GOATBOARD VERIFIED</text>
  <text x="78" y="50" fill="#090909" font-family="Figtree,Arial,sans-serif" font-size="18" font-weight="800">${badge.shortLabel}</text>
  <circle cx="298" cy="36" r="7" fill="${badge.accent}"/>
  <path d="m294.5 36 2.2 2.2 4.6-5" fill="none" stroke="#111111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
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
  if (allowed.success) {
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
