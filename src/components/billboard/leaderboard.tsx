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
      {/* Hero row: visitor stats beside the #1 spotlight + ad slot, with the
          distribution promo joining as a third column once there's room for
          it at xl. Below that it spans the row underneath instead - a third
          column any narrower steals enough width from the spotlight to wrap
          its Vote/Boost/Share row onto two lines. Everything ranked #2+ flows
          in its own full-width grid below. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_204px]">
        {/* On a phone the counters would otherwise push the #1 spot below the
            fold, so they drop below it and sit two-up; the sidebar only
            becomes a single stacked column once it's beside the spotlight. */}
        <div className="order-2 grid grid-cols-2 gap-3 sm:gap-4 lg:order-1 lg:flex lg:flex-col">
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
            leaving a notch in the layout. Now that the ad slot and video spot
            live in their own row below (rather than stacked under the
            spotlight in this column), this stretch is to the spotlight's
            height alone — a shorter, tighter banner. */}
        <DistributionPromo
          mascot={promoMascot}
          className="order-3 lg:col-span-2 xl:col-span-1"
        />
      </div>

      {/* Ad slot + video spot, side by side: the ad banner compressed down to
          a narrower share so the continuously-playing video gets most of the
          width. Stacks on a phone, where neither has room to shrink further. */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <AdSlotDisplay ad={adSlot} mascot={adSlotMascot} className="sm:w-2/5 sm:shrink-0" />
        <VideoAdDisplay videoAd={videoAd} className="sm:flex-1" />
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
