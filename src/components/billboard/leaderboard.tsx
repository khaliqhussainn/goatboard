"use client";

import * as React from "react";
import { LayoutGroup } from "motion/react";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { CampaignSlot } from "@/components/billboard/campaign-slot";
import { AdSlotDisplay } from "@/components/billboard/ad-slot-display";
import { VideoAdDisplay } from "@/components/billboard/video-ad-display";
import { VisitorStatsCard } from "@/components/billboard/visitor-stats-card";
import { DistributionPromo } from "@/components/distribution/distribution-promo";
import { EmptyBoard } from "@/components/billboard/empty-board";
import type { Campaign, CurrentAd, CurrentVideoAd, VisitorStats } from "@/lib/types";

export function Leaderboard({
  initialCampaigns,
  adSlot,
  adSlotMascot,
  videoAd,
  promoMascot,
  visitorStats,
}: {
  initialCampaigns: Campaign[];
  adSlot: CurrentAd | null;
  adSlotMascot: string | null;
  videoAd: CurrentVideoAd | null;
  promoMascot: string | null;
  visitorStats: VisitorStats;
}) {
  const { campaigns, applyOptimisticVote } = useRealtimeLeaderboard(initialCampaigns);
  const prevFirstId = React.useRef<string | null>(initialCampaigns[0]?.id ?? null);
  const [justTookFirst, setJustTookFirst] = React.useState<string | null>(null);

  React.useEffect(() => {
    const currentFirst = campaigns[0]?.id ?? null;
    if (currentFirst && prevFirstId.current && currentFirst !== prevFirstId.current) {
      setJustTookFirst(currentFirst);
      const timer = setTimeout(() => setJustTookFirst(null), 2600);
      prevFirstId.current = currentFirst;
      return () => clearTimeout(timer);
    }
    prevFirstId.current = currentFirst;
  }, [campaigns]);

  const [first, ...rest] = campaigns;

  return (
    <LayoutGroup>
      {/* One grid, not two stacked blocks — everything here has to line up
          into a single rectangle: stats down the left spanning both rows,
          spotlight+distribution on top, ad slot+video spot below lined up
          under exactly that same span (xl:col-start-2 + xl:col-span-2), never
          under the stats column. Below that it spans the row underneath
          instead - a third column any narrower steals enough width from the
          spotlight to wrap its Vote/Boost/Share row onto two lines.
          Everything ranked #2+ flows in its own full-width grid below. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_204px]">
        {/* On a phone the counters would otherwise push the #1 spot below the
            fold, so they drop below it and sit two-up; the sidebar only
            becomes a single stacked column once it's beside the spotlight.
            Spans both grid rows at xl so it runs the full height alongside
            the ad slot + video row too, instead of stopping at the spotlight. */}
        <div className="order-2 grid grid-cols-2 gap-3 sm:gap-4 lg:order-1 lg:flex lg:flex-col xl:row-span-2">
          <VisitorStatsCard initial={visitorStats} />
        </div>

        <div className="order-1 lg:order-2">
          {first ? (
            <CampaignSlot
              key={first.id}
              campaign={first}
              rank={1}
              isNewFirst={justTookFirst === first.id}
              onVoted={applyOptimisticVote}
            />
          ) : (
            <EmptyBoard />
          )}
        </div>

        {/* Third in the reading order everywhere: on a phone it follows the
            spotlight and the counters rather than pushing them down, and it
            keeps that position once the row goes three-up.

            No self-start: as the third column it stretches to the row, so its
            foot lines up with the spotlight instead of stopping short and
            leaving a notch in the layout. */}
        <DistributionPromo
          mascot={promoMascot}
          className="order-3 lg:col-span-2 xl:col-span-1"
        />

        {/* Ad slot + video spot: a second grid row, pinned under the spotlight
            column (never the stats column, which is what let it drift under
            the sidebar before) and widened to also span the distribution
            column once that's a column of its own at xl - so this row's
            outer edges exactly match the row above it. Filling the row edge
            to edge (video as flex-1, both stretched to the same height) is
            what makes the two rows read as one rectangle instead of the ad
            slot and video floating as separate, differently-sized cards. */}
        <div className="order-4 flex flex-col gap-4 sm:h-44 sm:flex-row lg:col-start-2 xl:col-span-2">
          <AdSlotDisplay
            ad={adSlot}
            mascot={adSlotMascot}
            compact
            className="w-full sm:h-full sm:w-3/5 sm:shrink-0"
          />
          <VideoAdDisplay videoAd={videoAd} className="sm:h-full sm:flex-1" />
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {rest.map((campaign, index) => (
            <CampaignSlot
              key={campaign.id}
              campaign={campaign}
              rank={index + 2}
              isNewFirst={justTookFirst === campaign.id}
              onVoted={applyOptimisticVote}
            />
          ))}
        </div>
      )}
    </LayoutGroup>
  );
}
