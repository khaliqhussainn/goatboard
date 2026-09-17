"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { ListingVoteGate } from "@/components/campaign/listing-vote-gate";
import { CampaignCreationForm } from "@/components/campaign/campaign-creation-form";
import { LISTING_PRICE_USD } from "@/lib/listing";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

/**
 * Listing a campaign, in two steps: vote for somebody, then fill the form and
 * pay. The vote comes first because it is the cheaper ask - nobody wants to
 * write their pitch and then be told there is a hoop left.
 *
 * Both halves are guarded server-side: POST /api/campaigns re-checks the vote
 * and creates the campaign as pending_payment, so neither step can be skipped
 * by driving the UI.
 */
export function CreateFlow({
  campaigns,
  hasVoted,
}: {
  campaigns: Campaign[];
  /** Whether this visitor's vote already satisfies the gate on arrival. */
  hasVoted: boolean;
}) {
  const [voted, setVoted] = React.useState(hasVoted);
  // Opens straight on the form when the server says the gate is already
  // satisfied - there is nothing to do on step one, and Back still goes
  // there. Initial state rather than an effect, so the first render is
  // already the right step instead of flashing the wrong one.
  const [step, setStep] = React.useState<1 | 2>(hasVoted ? 2 : 1);

  return (
    <div className="flex flex-col gap-6">
      <Stepper step={step} voted={voted} onBack={() => setStep(1)} />

      {step === 1 ? (
        <ListingVoteGate
          campaigns={campaigns}
          satisfied={voted}
          onSatisfied={() => setVoted(true)}
          onContinue={() => setStep(2)}
        />
      ) : (
        <CampaignCreationForm onVoteRequired={() => setStep(1)} />
      )}
    </div>
  );
}

function Stepper({
  step,
  voted,
  onBack,
}: {
  step: 1 | 2;
  voted: boolean;
  onBack: () => void;
}) {
  const items = [
    { n: 1 as const, label: "Vote", done: voted },
    { n: 2 as const, label: `Your campaign · $${LISTING_PRICE_USD}`, done: false },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
      {items.map((item, i) => (
        <React.Fragment key={item.n}>
          <button
            type="button"
            // Only going back is allowed. Forward is the gate's job.
            disabled={item.n >= step}
            onClick={onBack}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-colors",
              item.n === step
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
              item.n < step && "hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "inline-flex size-4 items-center justify-center rounded-full text-[10px]",
                item.done ? "bg-accent-green text-green-700" : "bg-background/25",
              )}
            >
              {item.done ? <Check className="size-2.5" /> : item.n}
            </span>
            {item.label}
          </button>
          {i === 0 && <span className="text-muted-foreground">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
