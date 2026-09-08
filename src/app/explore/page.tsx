import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { EmptyBoard } from "@/components/billboard/empty-board";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every campaign currently fighting for the #1 spot on GOATBOARD.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("total_power", { ascending: false })
    .order("updated_at", { ascending: true });

  if (category) {
    query = query.eq("category", category as Category);
  }

  const { data: campaigns } = await query.limit(100);

  return (
    <div className="on-backdrop mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Explore</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything currently fighting for the board.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/explore"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            !category
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-muted hover:text-foreground",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/explore?category=${c.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              category === c.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-muted hover:text-foreground",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {!campaigns || campaigns.length === 0 ? (
          <EmptyBoard />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
