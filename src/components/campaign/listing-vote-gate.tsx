"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { VoteButton } from "@/components/billboard/vote-button";
import { PowerDisplay } from "@/components/billboard/power-display";
import { Button } from "@/components/ui/button";
import { VOTE_GATE_COPY } from "@/lib/listing";
import type { Campaign } from "@/lib/types";

/**
 * Step one of listing a campaign: vote for somebody else's first.
 *
 * The vote is a real one - VoteButton posting to /api/votes, through the same
 * cast_vote path and the same one-per-campaign-per-day rule as the board. The
 * unlock here is only the visible half; POST /api/campaigns checks the votes
 * table again and refuses without one, so skipping this in the browser buys
 * nothing.
 */
export function ListingVoteGate({
  campaigns,
  satisfied,
  onSatisfied,
  onContinue,
}: {
  campaigns: Campaign[];
  satisfied: boolean;
  onSatisfied: () => void;
  onContinue: () => void;
}) {
  // Which card was just voted on, so the tile can show it landed rather than
  // only the Continue button changing at the bottom of the screen.
  const [votedId, setVotedId] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="billboard-surface flex flex-col gap-2 rounded-[1.75rem] bg-gradient-to-b from-[#fdf6d8] via-[#fdfaec] to-[#fcf3cf] p-5 ring-1 ring-inset ring-white/70 sm:p-6">
        <h2 className="font-handwritten text-2xl uppercase leading-[1.05] tracking-tight sm:text-3xl">
          {VOTE_GATE_COPY.heading}
        </h2>
        <p className="max-w-lg text-sm text-muted-foreground">{VOTE_GATE_COPY.body}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campaigns.map((c) => {
          const justVoted = votedId === c.id;
          return (
            <div
              key={c.id}
              className="billboard-surface-sm flex items-center gap-3 rounded-2xl p-3 sm:p-4"
            >
              <CampaignAvatar src={c.image_url} name={c.name} className="size-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                <PowerDisplay power={c.total_power} size="sm" className="mt-0.5" />
              </div>

              {justVoted ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-accent-green px-2.5 py-1.5 text-[13px] font-bold text-green-700">
                  <Check className="size-3.5" /> Voted
                </span>
              ) : (
                <VoteButton
                  campaignId={c.id}
                  size="sm"
                  className="shrink-0"
                  onVoted={() => {
                    setVotedId(c.id);
                    onSatisfied();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {satisfied ? VOTE_GATE_COPY.done : VOTE_GATE_COPY.locked}
        </p>
        <Button
          size="lg"
          variant="abstract"
          disabled={!satisfied}
          onClick={onContinue}
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
