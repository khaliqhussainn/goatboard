"use client";

import * as React from "react";
import { Sparkle, ExternalLink } from "lucide-react";
import { AdSlotForm } from "@/components/billboard/ad-slot-form";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentAd } from "@/lib/types";

const SPARKLES = [
  "absolute left-10 top-6 size-3 sm:left-16",
  "absolute left-24 bottom-5 size-2.5 sm:left-36",
  "absolute right-[38%] top-5 size-2",
  "absolute right-[30%] bottom-6 size-3",
  "absolute right-10 top-1/2 size-3 -translate-y-1/2 sm:right-16",
];

/**
 * The goat stands on the banner's bottom edge and is deliberately taller
 * than the banner, so its head breaks out over the top — which only works
 * because neither banner state clips its overflow. Kept out of the content
 * row's flex flow (absolute) from sm up so the banner's height stays set by
 * its text, not by however tall this particular pose happens to be; on
 * mobile, where the banner stacks, it drops back into normal flow instead of
 * overlapping the stacked content.
 */
function AdSlotMascot({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="pointer-events-none mx-auto mb-5 block h-24 w-auto drop-shadow-[0_14px_22px_rgba(88,28,135,0.28)] sm:absolute sm:bottom-0 sm:left-10 sm:mx-0 sm:mb-0 sm:h-40 sm:transition-transform sm:duration-300 sm:group-hover:-translate-y-1.5"
    />
  );
}

export function AdSlotDisplay({
  ad,
  mascot,
}: {
  ad: CurrentAd | null;
  /** The ad slot's own goat, distinct from the sponsor's logo — rotates once
   * per hour (see pickHourlyMascot in lib/mascots.ts). Null only if no
   * mascot art exists at all. */
  mascot: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* From sm up the goat owns the top-left corner (it breaks out over the
          banner's edge there), so the badge moves across to keep clear of it. */}
      <span className="absolute -top-3 left-7 z-10 inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-auto sm:right-9">
        🐐 {ad ? "Sponsored" : "Ad space · 7 days"}
      </span>
      <Sparkle className="absolute -top-4 left-0 z-10 size-5 fill-purple-300 text-purple-300 sm:-left-1" />

      {ad ? (
        <div className="relative rounded-[4rem] border-2 border-purple-200 bg-purple-50 px-6 py-8 sm:px-10">
          {mascot && <AdSlotMascot src={mascot} />}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:pl-44 sm:text-left">
            <CampaignAvatar
              src={ad.image_url}
              name={ad.name}
              className="size-16 shrink-0 rounded-2xl text-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black tracking-tight">{ad.name}</p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{ad.description}</p>
            </div>
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-200"
            >
              Visit <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full rounded-[4rem] border-2 border-dashed border-purple-300 bg-purple-50 px-8 py-8 text-left transition-colors hover:border-purple-400 hover:bg-purple-100/60 sm:px-10"
        >
          {SPARKLES.map((cls, i) => (
            <Sparkle
              key={i}
              className={cn(cls, "fill-purple-300/70 text-purple-300/70")}
              aria-hidden
            />
          ))}

          {mascot && <AdSlotMascot src={mascot} />}

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:pl-44">
            <p className="font-handwritten text-2xl leading-tight text-purple-700 sm:text-3xl">
              Your product could be here
            </p>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-5 py-2.5 text-sm font-bold text-purple-700 transition-colors group-hover:bg-purple-200">
              Get noticed →
            </span>
          </div>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent the ad spot</DialogTitle>
          </DialogHeader>
          <AdSlotForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
