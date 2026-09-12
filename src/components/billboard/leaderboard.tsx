"use client";

import * as React from "react";
import { LayoutGroup } from "motion/react";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { CampaignSlot } from "@/components/billboard/campaign-slot";
import { AdSlotDisplay } from "@/components/billboard/ad-slot-display";
import { VisitorStatsCard } from "@/components/billboard/visitor-stats-card";
import { EmptyBoard } from "@/components/billboard/empty-board";
import type { Campaign, CurrentAd, VisitorStats } from "@/lib/types";

export function Leaderboard({
  initialCampaigns,
  adSlot,
  adSlotMascot,
  visitorStats,
}: {
  initialCampaigns: Campaign[];
  adSlot: CurrentAd | null;
  adSlotMascot: string | null;
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
      {/* Hero row: a visitor-stats sidebar beside the #1 spotlight + ad slot.
          Everything else ranked #2+ flows in its own full-width grid below,
          not confined to the spotlight column. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* On a phone the counters would otherwise push the #1 spot below the
            fold, so they drop below it and sit two-up; the sidebar only
            becomes a single stacked column once it's beside the spotlight. */}
        <div className="order-2 grid grid-cols-2 gap-3 sm:gap-4 lg:order-1 lg:flex lg:flex-col">
          <VisitorStatsCard initial={visitorStats} />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
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
          <AdSlotDisplay ad={adSlot} mascot={adSlotMascot} />
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
