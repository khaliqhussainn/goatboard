import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Leaderboard } from "@/components/billboard/leaderboard";
import { AdPurchaseConfirmation } from "@/components/billboard/ad-purchase-confirmation";
import { getVisitorStats } from "@/lib/queries/visitors";
import { getCurrentAd } from "@/lib/queries/ad-slots";
import type { Campaign } from "@/lib/types";

export const revalidate = 0;

async function getCampaigns(): Promise<Campaign[]> {
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
  const [campaigns, visitorStats, adSlot] = await Promise.all([
    getCampaigns(),
    getVisitorStats(),
    getCurrentAd(),
  ]);

  return (
    <>
      <AbstractBackdrop />
      <div className="on-backdrop mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={null}>
          <AdPurchaseConfirmation />
        </Suspense>

        <Leaderboard initialCampaigns={campaigns} adSlot={adSlot} visitorStats={visitorStats} />
      </div>
    </>
  );
}
