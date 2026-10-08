import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_DEFINITIONS, isAchievementType } from "@/lib/achievements";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// A 54px monochrome, transparent compression of public/icon.png (1.1 KB).
// Embedded in the SVG because browsers intentionally block nested external
// image requests when an SVG itself is displayed through an <img> element.
const BADGE_ICON_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAABGlBMVEVMaXERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERGEke4QAAAAXXRSTlMA+h+2BfxWAv4HNc7mFpevN/LwOtPaJhplCn2qIm7F2N0O9+t/lWIyGIsR7srkvmyGJEOowEoMHV7MW9+ET9GajrStVIK5wj549S5NWaGeamBz4hNGcZCjepI8x3aL7d20AAAACXBIWXMAAAPoAAAD6AG1e1JrAAACpklEQVRIx4WWB3viMAyGxXTC3rQclFJmGe2117337b2H/v/fOGcQy44dBDx45M0ny7ISQIQVxgD2y+haoucM8AYEGGP8y3RcBoVVVYzcXO6+QGq7Mlb60I8h7pyFqE0KVRDTBFsTM+W2RCUotYUW9qcBVpH82CHcIZ3g7mAKO0sMVROYGCveXy64mIUJH0ugkWsFI0e8d8YhxC8elg9TuOUGlAmxEtgMfniyHqYRc+Jlc64p5JMAx87aLDzxsKV9y6RVN3eXvaGjHrd4QDALEuZelxP7IImfuLMF3rqKKxh3Iwmot5aXPJeDtA0y1uUzDD4aOOemZFP4r0W97KGJUzGQJkwYJlVs4g6/czeqaMRQxQBe5Z4aoKR0yLrLMxU6b+sYZVVVjSW9G72OxNCXU9WOySX1vDPyUsL2dE4ymNOcdKsLQJdgt56cqiYueO5mMjcbwl4qWFubFHsEs3VrGwXTBVG/GJV7E8YYPAumM7QIbQjsrQ7LBtMNiom74Vo0VqLYqcBGOkyU32vD2tK6kHzSRnJMsH0dFhfz7/19Y/JJykD0duNAM4YY1yZXUc131iEDM6u+rlWLOje81GFNfwLoFilV2q3+B4Zjaq4kloPdmbAjM8c/QxMG4edITICfjRit5961bjDcBh5GYPBH0ir88xnejkdhAJMbp5j8nd9u3+fh0Ycs/qwxYna8aUsvGgWf4r5umzD7ga9sURDHLX9HHC4ZsOSBH4fr6pR3p+OHGYnNBhiwi6VDiP3aaXYhhzRtwNgmCbv0L4mp2NeKlEyKjWGlmia1OmDC4MbPiDAUBF+H9c61XMop7hEYtGuhVTndWRoiMbAvYkE8LMtKOY3YcAIrMP6+NKhLYle/mmrK6lOZZb7/nJ9Xyrna4+9RQ/PujIj/AQMEPa/0x9dcAAAAAElFTkSuQmCC";

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
  <image href="${BADGE_ICON_DATA_URI}" x="10" y="9" width="54" height="54"/>
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
