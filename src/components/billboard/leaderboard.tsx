"use client";

import * as React from "react";
import { LayoutGroup } from "motion/react";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { CampaignSlot } from "@/components/billboard/campaign-slot";
import { AdSlotDisplay } from "@/components/billboard/ad-slot-display";
import { EmptyBoard } from "@/components/billboard/empty-board";
import type { Campaign, CurrentAd } from "@/lib/types";

export function Leaderboard({
  initialCampaigns,
  adSlot,
}: {
  initialCampaigns: Campaign[];
  adSlot: CurrentAd | null;
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

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4">
        <EmptyBoard />
        <AdSlotDisplay ad={adSlot} />
      </div>
    );
  }

  const [first, ...rest] = campaigns;

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <CampaignSlot
          key={first.id}
          campaign={first}
          rank={1}
          isNewFirst={justTookFirst === first.id}
          onVoted={applyOptimisticVote}
        />

        <div className="col-span-1 sm:col-span-2">
          <AdSlotDisplay ad={adSlot} />
        </div>

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
    </LayoutGroup>
  );
}
