"use client";

import * as React from "react";
import { Sparkle, ExternalLink } from "lucide-react";
import { AdSlotForm } from "@/components/billboard/ad-slot-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentAd } from "@/lib/types";

const EMPTY_AD_MASCOT = "/mascots/goat-1.webp";

/**
 * The advertiser's optional full-bleed background. Clipped to the banner's
 * own radius and kept at full strength. A live placement intentionally shows
 * only this artwork and its destination button.
 */
function AdSlotBackdrop({ src, rounded = "rounded-[4rem]" }: { src: string; rounded?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", rounded)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}

/**
 * The unsold ad slot mirrors the billboard creative itself: a warm editorial
 * canvas, the GOAT pointing at an intentionally empty placement, and one
 * direct booking CTA. It is a real button rather than a mock banner, so the
 * entire surface still opens the existing checkout dialog.
 */
function EmptyAdSlot({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden border-[3px] border-white bg-[#ffdc68] text-left shadow-[0_18px_45px_-20px_rgba(118,75,10,0.5)] ring-1 ring-amber-200/70 transition-transform duration-300 hover:-translate-y-0.5",
        compact
          ? "h-full min-h-[260px] rounded-2xl sm:min-h-0"
          : "min-h-[300px] rounded-[2.25rem] sm:min-h-[360px]",
      )}
    >
      {/* Broad cream shapes reproduce the layered paper-like background from
          the reference without baking text into an image. */}
      <span
        aria-hidden
        className="absolute -left-[12%] -top-[55%] h-[150%] w-[75%] rotate-[8deg] rounded-[45%] bg-[#fff9e8] shadow-[0_0_70px_35px_rgba(255,249,232,0.82)]"
      />
      <span
        aria-hidden
        className="absolute -bottom-[48%] -left-[16%] h-[90%] w-[66%] -rotate-[7deg] rounded-[50%] bg-[#fff3cf]/90"
      />
      <span
        aria-hidden
        className="absolute -right-[8%] -top-[38%] h-[95%] w-[40%] rounded-[48%] bg-[#ffe883]/80"
      />

      <span
        className={cn(
          "absolute left-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/45 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#30353e] shadow-[0_7px_18px_-10px_rgba(83,54,6,0.6)] backdrop-blur-sm",
          !compact && "left-6 top-6 px-5 py-3 text-sm",
        )}
      >
        Ad space · 7 days
        <Sparkle className="size-3.5 fill-[#f5b91d] text-[#f5b91d]" aria-hidden />
      </span>

      <div
        className={cn(
          "relative z-20 flex h-full flex-col items-start",
          compact
            ? "justify-start pb-4 pl-5 pr-[38%] pt-14 sm:pr-[44%] xl:pl-7"
            : "justify-center p-8 pt-20 sm:w-[62%] sm:p-12 sm:pt-24",
        )}
      >
        <p
          className={cn(
            "flex flex-col gap-0 font-black leading-[0.88] tracking-[-0.045em] text-black",
            compact
              ? "text-[clamp(1.5rem,2.5vw,2rem)]"
              : "text-[clamp(2.5rem,5vw,5.25rem)]",
          )}
        >
          <span className="block">Get in front of</span>
          <span className="-mt-1 block text-[#f5a313] sm:-mt-1.5">hundreds of eyes</span>
        </p>
        <p
          className={cn(
            "max-w-xl font-semibold leading-snug text-[#55585d]",
            compact ? "mt-0 hidden text-xs xl:block" : "mt-1 text-sm sm:text-lg",
          )}
        >
          Advertise here and put your product where builders actually look.
        </p>
        <span
          className={cn(
            "inline-flex items-center rounded-full bg-[#321707] font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(50,23,7,0.8)] transition-colors group-hover:bg-black",
            compact
              ? "mt-1 px-4 py-2 text-xs"
              : "mt-2 px-7 py-3.5 text-base sm:px-9 sm:py-4 sm:text-lg",
          )}
        >
          Advertise here <span className="ml-2 text-lg leading-none">→</span>
        </span>
      </div>

      {/* The empty dashed card is deliberately visible: it turns the abstract
          promise into a literal placement waiting for the advertiser. */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-4 right-3 top-4 z-10 hidden rotate-[-2deg] rounded-[1.75rem] border-[3px] border-dashed border-[#dda51c]/75 bg-[#fff5c9]/55 shadow-[0_14px_30px_-20px_rgba(91,57,0,0.45)] sm:block",
          compact ? "w-[27%]" : "bottom-8 right-8 top-8 w-[25%] rounded-[2.5rem]",
        )}
      >
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-light text-[#dca51d]/75">
          +
        </span>
      </span>

      {/* Fixed pose for the house creative; paid ads still use the hourly
          rotating mascot supplied by the homepage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={EMPTY_AD_MASCOT}
        alt=""
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-[-3%] z-20 w-auto drop-shadow-[0_16px_24px_rgba(111,75,13,0.24)] transition-transform duration-300 group-hover:-translate-y-1",
          compact
            ? "-right-[4%] h-[60%] sm:right-[17%] sm:h-[74%] xl:h-[82%]"
            : "right-[17%] h-[82%]",
        )}
      />

      <Sparkle
        aria-hidden
        className={cn(
          "absolute z-20 size-5 fill-[#ffc928] text-[#ffc928]",
          compact ? "bottom-5 left-3" : "bottom-10 left-8 size-7",
        )}
      />
    </button>
  );
}

export function AdSlotDisplay({
  ad,
  className,
  compact,
}: {
  ad: CurrentAd | null;
  /** Retained at the call site for the empty house creative, but deliberately
   * ignored while a paid backdrop is live. */
  mascot?: string | null;
  className?: string;
  /** A short, tight rectangle instead of the tall gold pill — for when the
   * banner is sharing a row with the video spot and doesn't have the width
   * (or the height budget) for the full treatment. */
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative", compact ? "" : "mb-3 sm:mb-4", className)}>
      {compact ? (
        ad ? (
          <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl bg-black shadow-[0_12px_32px_-18px_rgba(0,0,0,0.5)]">
            {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} rounded="rounded-2xl" />}
            <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
              Sponsored
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              Book next →
            </button>
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${ad.name}`}
              className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Visit site <ExternalLink className="size-3.5" />
            </a>
          </div>
        ) : (
          <EmptyAdSlot compact onClick={() => setOpen(true)} />
        )
      ) : ad ? (
        <div className="relative min-h-[300px] overflow-hidden rounded-[4rem] bg-black shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] sm:min-h-[360px]">
          {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} />}
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
            Sponsored
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            Book next →
          </button>
          <a
            href={ad.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${ad.name}`}
            className="absolute bottom-6 left-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-transform hover:-translate-y-0.5 sm:bottom-8 sm:left-8"
          >
            Visit site <ExternalLink className="size-3.5" />
          </a>
        </div>
      ) : (
        <EmptyAdSlot onClick={() => setOpen(true)} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ad ? "Book the next ad spot" : "Rent the ad spot"}</DialogTitle>
          </DialogHeader>
          <AdSlotForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
