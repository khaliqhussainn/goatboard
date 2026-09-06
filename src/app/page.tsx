import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Leaderboard } from "@/components/billboard/leaderboard";
import type { Campaign } from "@/lib/types";

export const revalidate = 0;

async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("total_power", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(20);

  return data ?? [];
}

export default async function Home() {
  const campaigns = await getCampaigns();

  return (
    <>
      <AbstractBackdrop />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
          <span className="h-px w-8 bg-foreground/20" />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            The board
          </span>
          <span className="h-px w-8 bg-foreground/20" />
        </div>

        <Leaderboard initialCampaigns={campaigns} />
      </div>
    </>
  );
}
