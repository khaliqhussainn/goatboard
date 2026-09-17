import type { Metadata } from "next";
import { getVisitorId } from "@/lib/visitor";
import { getVoteCandidates, isVoteGateSatisfied } from "@/lib/queries/vote-gate";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CreateFlow } from "@/components/campaign/create-flow";
import { LISTING_PRICE_USD } from "@/lib/listing";

export const metadata: Metadata = {
  title: "Create Campaign",
  description: "Put something on the GOATBOARD. Create a campaign and start collecting Power.",
};

// Reads the visitor's vote state, so it can't be cached.
export const revalidate = 0;

/** How many startups the vote step offers to choose from. */
const VOTE_CHOICES = 6;

export default async function CreatePage() {
  const visitorId = await getVisitorId();

  const [voted, candidates] = await Promise.all([
    visitorId ? isVoteGateSatisfied(visitorId) : Promise.resolve(false),
    getVoteCandidates(VOTE_CHOICES),
  ]);

  return (
    <div className="on-backdrop mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          I have something I want people to notice.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vote for one startup, then put yours up for ${LISTING_PRICE_USD}.
        </p>
      </div>
      <CreateFlow campaigns={candidates} hasVoted={voted} />
    </div>
  );
}
