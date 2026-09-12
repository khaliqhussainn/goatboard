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
  "absolute left-[46%] top-1/2 size-3 -translate-y-1/2",
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
function AdSlotMascot({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={cn(
        "pointer-events-none w-auto drop-shadow-[0_14px_22px_rgba(88,28,135,0.28)] sm:absolute sm:left-auto sm:right-8 sm:top-1/2 sm:mx-0 sm:-mt-20 sm:mb-0 sm:h-40 sm:transition-transform sm:duration-300 sm:group-hover:-translate-y-1.5",
        className,
      )}
    />
  );
}

/**
 * The advertiser's optional full-bleed background. Clipped to the banner's
 * own radius by its own wrapper rather than overflow-hidden on the banner,
 * which would also cut off the goat breaking past the edges. Held at a low
 * opacity, with a scrim that's heaviest behind the copy and clears toward
 * the goat, so any uploaded image stays readable underneath the text.
 */
function AdSlotBackdrop({ src }: { src: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4rem]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover opacity-25" />
      <span className="absolute inset-0 bg-gradient-to-r from-purple-50/85 via-purple-50/40 to-transparent" />
    </span>
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
    <div className="relative mb-3 sm:mb-4">
      <span className="absolute -top-3 left-7 z-10 inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
        🐐 {ad ? "Sponsored" : "Ad space · 7 days"}
      </span>
      <Sparkle className="absolute -top-4 left-0 z-10 size-5 fill-purple-300 text-purple-300 sm:-left-1" />

      {ad ? (
        <div className="relative rounded-[4rem] border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100 px-6 py-8 shadow-[0_18px_50px_-28px_rgba(88,28,135,0.45)] ring-1 ring-inset ring-white/70 sm:px-10">
          {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} />}
          {mascot && <AdSlotMascot src={mascot} className="mx-auto mb-5 block h-24" />}
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:pr-44 sm:text-left">
            <CampaignAvatar
              src={ad.image_url}
              name={ad.name}
              className="size-16 shrink-0 rounded-2xl text-xl shadow-sm ring-2 ring-white"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black tracking-tight">{ad.name}</p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{ad.description}</p>
            </div>
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700"
            >
              Visit <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full rounded-[4rem] border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-100 px-5 py-6 text-left shadow-[0_18px_50px_-28px_rgba(88,28,135,0.4)] ring-1 ring-inset ring-white/70 transition-colors hover:border-purple-400 hover:from-purple-100/70 hover:to-purple-200/60 sm:px-10 sm:py-8"
        >
          {SPARKLES.map((cls, i) => (
            <Sparkle
              key={i}
              className={cn(cls, "fill-purple-300/70 text-purple-300/70")}
              aria-hidden
            />
          ))}

          {/* On a phone the goat tucks into the bottom-right instead of
              stacking above the copy, which keeps this banner about a third
              of the height it would be otherwise. */}
          {mascot && <AdSlotMascot src={mascot} className="absolute right-1 top-1/2 -mt-16 h-32" />}

          <div className="relative flex flex-col items-start gap-3 pr-20 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pr-44">
            <p className="font-handwritten text-xl leading-tight text-purple-700 sm:text-3xl">
              Your product could be here
            </p>

            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700 transition-colors group-hover:bg-purple-200 sm:px-5 sm:py-2.5">
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
