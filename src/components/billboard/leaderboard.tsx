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
  visitorStats,
}: {
  initialCampaigns: Campaign[];
  adSlot: CurrentAd | null;
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
        <div className="flex flex-col gap-4">
          <VisitorStatsCard initial={visitorStats} />
        </div>

        <div className="flex flex-col gap-4">
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
          <AdSlotDisplay ad={adSlot} />
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
