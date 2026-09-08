import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, ArrowUp, Zap, Crown, Award, Share2 } from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description: "How campaigns, votes, Power, and the #1 spotlight work on GOATBOARD.",
};

const STEPS = [
  {
    icon: PlusCircle,
    title: "Publish a campaign",
    body: "Put anything on the board - a product, startup, website, app, meme, or cause. No account required: this browser is your key.",
  },
  {
    icon: ArrowUp,
    title: "Collect free votes",
    body: "Anyone can vote once a day, for free. Every vote adds +1 Power and nudges you up the ranking.",
  },
  {
    icon: Zap,
    title: "Boost with Power",
    body: "Want to climb faster? Boost with real money - $1 buys 3 Power, permanently added to your total.",
  },
  {
    icon: Crown,
    title: "Take the #1 spot",
    body: "Campaigns are ranked purely by total Power. There's only one spotlight - the single #1 slot everyone is fighting for.",
  },
  {
    icon: Award,
    title: "Earn the GOAT badge",
    body: "Once a campaign reaches #1, it keeps a permanent GOAT badge - even after it's overtaken.",
  },
  {
    icon: Share2,
    title: "Share and grow",
    body: "Share your campaign link anywhere. More eyes, more votes, more Power, higher rank.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="on-backdrop mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">How GOATBOARD works</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          One public billboard. One #1 spotlight. Here&apos;s how anything - and anyone - climbs
          to the top.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="billboard-surface flex flex-col gap-3 rounded-[1.75rem] p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                <Icon className="size-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Step {i + 1}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="billboard-surface-lg mt-6 flex flex-col items-center gap-4 rounded-[2rem] py-12 text-center">
        <p className="text-xl font-black tracking-tight">Ready to take the board?</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Publish your campaign in under a minute, or check out who&apos;s currently winning.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/create">
            <Button size="lg" variant="abstract">
              Create Campaign
            </Button>
          </Link>
          <Link href="/explore">
            <Button size="lg" variant="outline">
              Explore the board
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
