import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Leaderboard } from "@/components/billboard/leaderboard";
import { AdPurchaseConfirmation } from "@/components/billboard/ad-purchase-confirmation";
import { getVisitorStats } from "@/lib/queries/visitors";
import { getCurrentAd } from "@/lib/queries/ad-slots";
import { getCurrentVideoAd } from "@/lib/queries/video-ads";
import { syncFirstPlace } from "@/lib/queries/first-place";
import { MASCOT_IMAGES, pickHourlyMascot } from "@/lib/mascots";
import type { Campaign } from "@/lib/types";

export const revalidate = 0;

async function getCampaigns(): Promise<Campaign[]> {
  // Advance the #1 streak before reading, so the board and the clock can
  // never disagree about who is top.
  await syncFirstPlace();

  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("total_power", { ascending: false })
    .order("updated_at", { ascending: true });

  return data ?? [];
}

export default async function Home() {
  const [campaigns, visitorStats, adSlot, videoAd] = await Promise.all([
    getCampaigns(),
    getVisitorStats(),
    getCurrentAd(),
    getCurrentVideoAd(),
  ]);

  // The promo stands next to the ad slot, so it takes a different pose -
  // otherwise the two goats twin whenever the hourly pick lands on the same
  // one. Offset rather than random so it stays stable across renders.
  const adSlotMascot = pickHourlyMascot();
  const promoMascot =
    adSlotMascot && MASCOT_IMAGES.length > 1
      ? MASCOT_IMAGES[(MASCOT_IMAGES.indexOf(adSlotMascot) + 7) % MASCOT_IMAGES.length]
      : adSlotMascot;

  return (
    <>
      <AbstractBackdrop />
      <div className="on-backdrop mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={null}>
          <AdPurchaseConfirmation />
        </Suspense>

        <Leaderboard
          initialCampaigns={campaigns}
          adSlot={adSlot}
          adSlotMascot={adSlotMascot}
          videoAd={videoAd}
          promoMascot={promoMascot}
          visitorStats={visitorStats}
        />
      </div>
    </>
  );
}
