import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Leaderboard } from "@/components/billboard/leaderboard";
import { VisitorStatsCard } from "@/components/billboard/visitor-stats-card";
import { getVisitorStats } from "@/lib/queries/visitors";
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
  const [campaigns, visitorStats] = await Promise.all([getCampaigns(), getVisitorStats()]);

  return (
    <>
      <AbstractBackdrop />
      <div className="on-backdrop mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-4 sm:mb-6">
          <VisitorStatsCard initial={visitorStats} />
        </div>

        <div className="mb-6 flex justify-center sm:mb-8">
          <Image
            src="/thegoat.png"
            alt="The Goat"
            width={2048}
            height={768}
            priority
            className="h-16 w-auto sm:h-20"
          />
        </div>

        <Leaderboard initialCampaigns={campaigns} />
      </div>
    </>
  );
}
