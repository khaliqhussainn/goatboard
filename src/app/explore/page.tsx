import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { SearchBar } from "@/components/campaign/search-bar";
import { EmptyBoard } from "@/components/billboard/empty-board";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every campaign currently fighting for the #1 spot on GOATBOARD.",
};

function categoryHref(category: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
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

  // Searches name, category, and the creator's X handle in one go. Stripped
  // of characters that have syntactic meaning in PostgREST's .or() filter
  // string (commas/parens) and a leading "@" so "@handle" and "handle" match
  // the same way x_handle is stored (without the @).
  const term = q?.trim().replace(/^@/, "").replace(/[,()]/g, "");
  if (term) {
    query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,x_handle.ilike.%${term}%`);
  }

  const { data: campaigns, error } = await query.limit(100);
  if (error) {
    console.error("explore query failed", error);
  }
  const isFiltered = Boolean(category || term);

  return (
    <div className="on-backdrop mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Explore</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything currently fighting for the board.
      </p>

      <SearchBar defaultValue={q ?? ""} category={category} className="mt-6 max-w-md" />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={categoryHref(undefined, q)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            !category
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-hero-pink hover:text-hero-pink",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={categoryHref(c.value, q)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              category === c.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-hero-pink hover:text-hero-pink",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {!campaigns || campaigns.length === 0 ? (
          isFiltered ? (
            <div className="billboard-surface-lg flex flex-col items-center gap-2 rounded-[2rem] py-20 text-center">
              <p className="text-xl font-black tracking-tight">No matches.</p>
              <p className="text-sm text-muted-foreground">
                Try a different name, category, or @handle.
              </p>
            </div>
          ) : (
            <EmptyBoard />
          )
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
