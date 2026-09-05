"use client";

import * as React from "react";
import { LayoutGroup } from "motion/react";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { CampaignSlot } from "@/components/billboard/campaign-slot";
import { EmptyBoard } from "@/components/billboard/empty-board";
import type { Campaign } from "@/lib/types";

const VISIBLE_COUNT = 10;

export function Leaderboard({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
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
    return <EmptyBoard />;
  }

  const visible = campaigns.slice(0, VISIBLE_COUNT);

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {visible.map((campaign, index) => (
          <CampaignSlot
            key={campaign.id}
            campaign={campaign}
            rank={index + 1}
            isNewFirst={justTookFirst === campaign.id}
            onVoted={applyOptimisticVote}
          />
        ))}
      </div>
    </LayoutGroup>
  );
}
