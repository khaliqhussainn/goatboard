"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUp, Plus, Sparkles } from "lucide-react";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import type { WeeklyVoteLeader } from "@/lib/types";

const FEATURE_BACKGROUNDS = [
  "from-accent-blue/70 to-accent-blue/25",
  "from-accent-pink/70 to-accent-pink/25",
  "from-accent-purple/70 to-accent-purple/25",
];

/**
 * The top three products by free votes created during the rolling last seven
 * days. A one-minute refresh lets old votes fall out of the window even when
 * nobody casts a new vote; voteSignal also refreshes immediately after any
 * live vote-power change. Neither paid nor lifetime Power is used here.
 */
export function WeeklyLaunches({
  initialLeaders,
  voteSignal,
}: {
  initialLeaders: WeeklyVoteLeader[];
  voteSignal: string;
}) {
  const [leaders, setLeaders] = React.useState(initialLeaders);

  React.useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch("/api/weekly-vote-leaders", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.ok) setLeaders((await response.json()) as WeeklyVoteLeader[]);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("weekly vote leaders refresh failed", error);
        }
      }
    }

    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [voteSignal]);

  return (
    <aside className="billboard-surface relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-[#fffdf7] to-[#fff4d8] p-4 sm:p-5">
      <div
        aria-hidden
        className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-accent-yellow/65 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -left-20 bottom-10 -z-10 size-52 rounded-full bg-accent-pink/35 blur-3xl"
      />

      <header className="relative min-h-44 shrink-0 overflow-hidden rounded-[1.5rem] px-3 py-4 sm:min-h-48 sm:px-5">
        <div className="relative z-10 max-w-[62%]">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-muted-foreground sm:text-xs">
            <Sparkles className="size-4 fill-accent-yellow text-[#eeb416]" />
            This week&apos;s
          </div>
          <h2 className="font-rounded text-4xl font-black leading-[0.9] tracking-[-0.055em] text-[#08162f] sm:text-5xl">
            Launches
          </h2>
          <div className="mt-2 h-2 w-36 -rotate-2 rounded-full bg-accent-yellow sm:w-44" />
          <p className="mt-4 max-w-xs text-sm font-semibold leading-snug text-muted-foreground">
            The three products with the most votes in the last seven days.
          </p>
        </div>

        <div aria-hidden className="absolute -right-3 -top-1 size-44 sm:right-0 sm:size-52">
          <div className="absolute inset-x-4 bottom-1 h-20 rounded-[50%] bg-accent-yellow/55 blur-xl" />
          <Image
            src="/mascots/goat-10.webp"
            alt=""
            fill
            sizes="208px"
            className="object-contain object-bottom drop-shadow-[0_12px_18px_rgba(8,22,47,0.18)]"
          />
        </div>
      </header>

      {leaders.length > 0 ? (
        <div className="relative min-h-0 flex-1">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Ranked by votes in this window
          </p>

          <div
            className="pretty-scroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3"
          >
            {leaders.map(({ campaign, voteCount }, index) => (
              <article
                key={campaign.id}
                className="flex w-[82%] min-w-0 shrink-0 snap-start flex-col rounded-2xl bg-white/90 p-2.5 shadow-[0_12px_30px_-18px_rgba(8,22,47,0.5)] ring-1 ring-black/[0.04] sm:w-[calc((100%-1.5rem)/3)]"
              >
                <Link
                  href={`/campaign/${campaign.slug}`}
                  className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${FEATURE_BACKGROUNDS[index % FEATURE_BACKGROUNDS.length]}`}
                  aria-label={`View ${campaign.name}`}
                >
                  <span className="absolute left-2 top-2 rounded-lg bg-accent-yellow px-2 py-1 text-xs font-black tabular-nums text-black shadow-sm">
                    #{index + 1}
                  </span>
                  <CampaignAvatar
                    src={campaign.image_url}
                    name={campaign.name}
                    className="size-16 rounded-2xl text-xl shadow-md sm:size-14 2xl:size-16"
                  />
                </Link>

                <div className="flex flex-1 flex-col px-0.5 pb-0.5 pt-2.5">
                  <Link
                    href={`/campaign/${campaign.slug}`}
                    className="truncate font-rounded text-base font-black tracking-tight text-[#08162f] transition-colors hover:text-hero-pink"
                  >
                    {campaign.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-[1.35] text-muted-foreground">
                    {campaign.description}
                  </p>
                  <Badge
                    variant={categoryAccent(campaign.category)}
                    className="mt-2 w-fit max-w-full truncate"
                  >
                    {categoryLabel(campaign.category)}
                  </Badge>

                  <div className="mt-3 flex items-end justify-between gap-1.5">
                    <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <ArrowUp className="size-3" />
                      {voteCount.toLocaleString("en-US")} {voteCount === 1 ? "vote" : "votes"}
                    </span>
                    <Link
                      href={`/campaign/${campaign.slug}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-black px-2.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5"
                    >
                      View <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-[#efbe31]/70 bg-white/55 px-6 py-8 text-center">
          <div>
            <p className="font-rounded text-lg font-black text-[#08162f]">
              Your product could be next
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No products have received votes in the last seven days.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex shrink-0 flex-col gap-3 rounded-2xl border-2 border-dashed border-[#efbe31] bg-white/60 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-yellow text-black shadow-sm">
            <Plus className="size-6 stroke-[3]" />
          </span>
          <div className="min-w-0">
            <p className="font-rounded text-sm font-black leading-tight text-[#08162f] sm:text-base">
              Rise into this week&apos;s top three
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              Every verified vote in the rolling seven-day window counts.
            </p>
          </div>
        </div>
        <Link
          href="/create"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-yellow px-5 font-rounded text-sm font-black text-black shadow-[0_8px_20px_-10px_rgba(238,180,22,0.9)] transition-transform hover:-translate-y-0.5"
        >
          Create campaign <ArrowRight className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
