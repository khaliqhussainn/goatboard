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
 * overlapping the stacked content. Not used in compact mode — there isn't
 * room for it once the banner is this narrow.
 */
function AdSlotMascot({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={cn(
        "pointer-events-none w-auto drop-shadow-[0_14px_22px_rgba(146,105,16,0.32)] sm:absolute sm:left-auto sm:right-8 sm:top-1/2 sm:mx-0 sm:-mt-20 sm:mb-0 sm:h-40 sm:transition-transform sm:duration-300 sm:group-hover:-translate-y-1.5",
        className,
      )}
    />
  );
}

/**
 * The highlight that travels across the metal, in its own rounded clip so the
 * banner itself never needs overflow-hidden - the goat breaks past its edges
 * and would be cut off. Decorative only; the global reduced-motion rule stops
 * it for anyone who asked for that. `rounded` matches whatever radius the
 * banner itself is using (the compact banner is a much gentler curve).
 */
function GoldSheen({ rounded = "rounded-[4rem]" }: { rounded?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", rounded)}>
      <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-[gold-sweep_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}

/**
 * The advertiser's optional full-bleed background. Clipped to the banner's
 * own radius by its own wrapper rather than overflow-hidden on the banner,
 * which would also cut off the goat breaking past the edges. Held at a low
 * opacity, with a scrim that's heaviest behind the copy and clears toward
 * the goat, so any uploaded image stays readable underneath the text.
 */
function AdSlotBackdrop({ src, rounded = "rounded-[4rem]" }: { src: string; rounded?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", rounded)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover opacity-25" />
      <span className="absolute inset-0 bg-gradient-to-r from-[#fffdf4]/90 via-[#fffdf4]/45 to-transparent" />
    </span>
  );
}

export function AdSlotDisplay({
  ad,
  mascot,
  className,
  compact,
}: {
  ad: CurrentAd | null;
  /** The ad slot's own goat, distinct from the sponsor's logo — rotates once
   * per hour (see pickHourlyMascot in lib/mascots.ts). Null only if no
   * mascot art exists at all. Ignored in compact mode. */
  mascot: string | null;
  className?: string;
  /** A short, tight rectangle instead of the tall gold pill — for when the
   * banner is sharing a row with the video spot and doesn't have the width
   * (or the height budget) for the full treatment. */
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative", compact ? "" : "mb-3 sm:mb-4", className)}>
      <span className="gold-surface absolute -top-3 left-5 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-[0_4px_12px_-4px_rgba(146,105,16,0.6)] ring-1 ring-inset ring-white/60">
        {ad ? "Sponsored" : "Ad space · 7 days"}
      </span>
      {!compact && (
        <Sparkle className="absolute -top-4 left-0 z-10 size-5 fill-amber-400 text-amber-400 sm:-left-1" />
      )}

      {compact ? (
        ad ? (
          <div className="gold-surface-soft relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border-2 border-amber-300/80 px-4 py-3 shadow-[0_12px_32px_-18px_rgba(146,105,16,0.55)] ring-1 ring-inset ring-white/70">
            {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} rounded="rounded-2xl" />}
            <GoldSheen rounded="rounded-2xl" />
            <div className="relative flex items-center gap-3">
              <CampaignAvatar
                src={ad.image_url}
                name={ad.name}
                className="size-10 shrink-0 rounded-xl text-sm shadow-sm ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black tracking-tight">{ad.name}</p>
                <p className="truncate text-xs text-foreground">{ad.description}</p>
              </div>
            </div>
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-2.5 flex items-center justify-center gap-1 rounded-full bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-50 shadow-sm transition-colors hover:bg-amber-900"
            >
              Visit <ExternalLink className="size-3" />
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="gold-surface group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-amber-300/90 px-4 py-3 text-center shadow-[0_12px_32px_-16px_rgba(146,105,16,0.65)] ring-1 ring-inset ring-white/60 transition-shadow hover:shadow-[0_16px_38px_-16px_rgba(146,105,16,0.8)]"
          >
            <GoldSheen rounded="rounded-2xl" />
            <p className="font-handwritten text-base leading-tight text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              Your product could be here
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-50 shadow-sm transition-colors group-hover:bg-amber-900">
              Get noticed →
            </span>
          </button>
        )
      ) : ad ? (
        <div className="gold-surface-soft relative rounded-[4rem] border-2 border-amber-300/80 px-6 py-8 shadow-[0_18px_50px_-24px_rgba(146,105,16,0.55)] ring-1 ring-inset ring-white/70 sm:px-10">
          {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} />}
          <GoldSheen />
          {mascot && <AdSlotMascot src={mascot} className="mx-auto mb-5 block h-24" />}
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:pr-44 sm:text-left">
            <CampaignAvatar
              src={ad.image_url}
              name={ad.name}
              className="size-16 shrink-0 rounded-2xl text-xl shadow-sm ring-2 ring-white"
            />
            {/* Nothing is clipped here. The advertiser paid for this space and
                the schema already caps them at 60 and 140 characters, so the
                banner grows to fit rather than trailing off in an ellipsis.
                break-words is what stops a single long unbroken word (a URL
                pasted into the name, say) pushing the row wider than the
                banner instead of wrapping. */}
            <div className="min-w-0 flex-1">
              <p className="break-words text-lg font-black tracking-tight">{ad.name}</p>
              {/* Full-strength foreground rather than the muted grey: this sits on gold,
                  and often on top of an advertiser backdrop as well, where grey-on-
                  gold stopped being comfortably legible. */}
              <p className="break-words text-sm text-foreground">{ad.description}</p>
            </div>
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-950 px-4 py-2 text-sm font-bold text-amber-50 shadow-sm transition-colors hover:bg-amber-900"
            >
              Visit <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="gold-surface group relative w-full rounded-[4rem] border-2 border-amber-300/90 px-5 py-6 text-left shadow-[0_18px_50px_-22px_rgba(146,105,16,0.65)] ring-1 ring-inset ring-white/60 transition-shadow hover:shadow-[0_22px_60px_-20px_rgba(146,105,16,0.8)] sm:px-10 sm:py-8"
        >
          <GoldSheen />

          {SPARKLES.map((cls, i) => (
            <Sparkle
              key={i}
              className={cn(cls, "fill-amber-200/90 text-amber-200/90")}
              aria-hidden
            />
          ))}

          {/* On a phone the goat tucks into the bottom-right instead of
              stacking above the copy, which keeps this banner about a third
              of the height it would be otherwise. */}
          {mascot && <AdSlotMascot src={mascot} className="absolute right-1 top-1/2 -mt-16 h-32" />}

          <div className="relative flex flex-col items-start gap-3 pr-20 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pr-44">
            <p className="font-handwritten text-xl leading-tight text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] sm:text-3xl">
              Your product could be here
            </p>

            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-950 px-4 py-2 text-sm font-bold text-amber-50 shadow-sm transition-colors group-hover:bg-amber-900 sm:px-5 sm:py-2.5">
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
