"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/lib/types";

function rankSort(a: Campaign, b: Campaign) {
  if (b.total_power !== a.total_power) return b.total_power - a.total_power;
  if (a.updated_at !== b.updated_at) return a.updated_at < b.updated_at ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

/**
 * Keeps a ranked campaign list in sync with Supabase Realtime, and exposes
 * an optimistic-update hook so the voter sees the ranking move immediately
 * instead of waiting on the round trip.
 */
export function useRealtimeLeaderboard(initial: Campaign[]) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(() =>
    [...initial].sort(rankSort),
  );
  const supabaseRef = React.useRef(createClient());

  React.useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("campaigns-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        (payload) => {
          setCampaigns((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as Partial<Campaign>).id;
              return prev.filter((c) => c.id !== oldId);
            }

            const updated = payload.new as Campaign;
            if (updated.status !== "active") {
              return prev.filter((c) => c.id !== updated.id);
            }

            const exists = prev.some((c) => c.id === updated.id);
            const next = exists
              ? prev.map((c) => (c.id === updated.id ? updated : c))
              : [...prev, updated];
            return next.sort(rankSort);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /** Optimistically reflects a vote this browser just cast. */
  const applyOptimisticVote = React.useCallback((id: string, totalPower: number) => {
    setCampaigns((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              total_power: totalPower,
              vote_power: totalPower - c.paid_power,
              updated_at: new Date().toISOString(),
            }
          : c,
      );
      return next.sort(rankSort);
    });
  }, []);

  return { campaigns, applyOptimisticVote };
}
