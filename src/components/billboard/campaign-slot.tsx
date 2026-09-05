"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { SpotlightCampaign } from "@/components/billboard/spotlight-campaign";
import { CampaignTile } from "@/components/billboard/campaign-tile";
import { RankingRow } from "@/components/billboard/ranking-row";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

type Tier = "spotlight" | "top3" | "list";

function tierOf(rank: number): Tier {
  if (rank === 1) return "spotlight";
  if (rank <= 3) return "top3";
  return "list";
}

const tierClass: Record<Tier, string> = {
  spotlight: "col-span-1 sm:col-span-2",
  top3: "col-span-1",
  list: "col-span-1 sm:col-span-2",
};

export function CampaignSlot({
  campaign,
  rank,
  isNewFirst,
  onVoted,
}: {
  campaign: Campaign;
  rank: number;
  isNewFirst: boolean;
  onVoted: (id: string, totalPower: number) => void;
}) {
  const tier = tierOf(rank);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      layoutId={campaign.id}
      transition={
        shouldReduceMotion
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 300, damping: 30, mass: 0.9 }
      }
      className={cn("relative", tierClass[tier])}
    >
      <AnimatePresence>
        {isNewFirst && (
          <motion.span
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-pink px-2.5 py-0.5 text-[11px] font-bold text-black shadow-sm"
          >
            ↑ NEW #1
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={tier}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tier === "spotlight" && (
            <SpotlightCampaign
              campaign={campaign}
              onVoted={(power) => onVoted(campaign.id, power)}
            />
          )}
          {tier === "top3" && (
            <CampaignTile
              campaign={campaign}
              rank={rank}
              onVoted={(power) => onVoted(campaign.id, power)}
            />
          )}
          {tier === "list" && (
            <RankingRow
              campaign={campaign}
              rank={rank}
              onVoted={(power) => onVoted(campaign.id, power)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
