"use client";

import * as React from "react";
import { Sparkle, ExternalLink } from "lucide-react";
import { AdSlotForm } from "@/components/billboard/ad-slot-form";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentAd } from "@/lib/types";

const EMPTY_AD_MASCOT = "/mascots/goat-1.webp";

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
 * The compact banner's goat, standing in the bottom-right corner. Unlike the
 * full-size AdSlotMascot it stays inside the card's bounds - the compact
 * banner is part of the board's collage, where anything breaking past an edge
 * lands in the gap between cards. Sized off the bottom edge so it reads as
 * standing on it, and clipped by the card's own overflow-hidden.
 */
function CompactMascot({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="pointer-events-none absolute -bottom-1 right-2 h-24 w-auto drop-shadow-[0_14px_22px_rgba(146,105,16,0.32)] transition-transform duration-300 group-hover:-translate-y-1 sm:h-40"
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
          <span className="block text-[#f5a313]">hundreds of eyes</span>
        </p>
        <p
          className={cn(
            "max-w-xl font-semibold leading-snug text-[#55585d]",
            compact ? "mt-2 hidden text-xs xl:block" : "mt-3 text-sm sm:text-lg",
          )}
        >
          Advertise here and put your product where builders actually look.
        </p>
        <span
          className={cn(
            "inline-flex items-center rounded-full bg-[#321707] font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(50,23,7,0.8)] transition-colors group-hover:bg-black",
            compact
              ? "mt-2 px-4 py-2 text-xs"
              : "mt-4 px-7 py-3.5 text-base sm:px-9 sm:py-4 sm:text-lg",
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
      {/* Compact tucks the badge inside the card's own bounds from sm up,
          where the card is tall enough to clear the content: in the collage
          this banner butts up against the spotlight above it, and a badge
          poking into that gap breaks the block's edge. On a phone the card is
          only as tall as its content, so it straddles the edge instead rather
          than landing on top of the ad's own name. */}
      {ad && (
        <span
          className={cn(
            "gold-surface absolute z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-[0_4px_12px_-4px_rgba(146,105,16,0.6)] ring-1 ring-inset ring-white/60",
            compact ? "-top-3 left-5 sm:left-3 sm:top-3" : "-top-3 left-5",
          )}
        >
          {ad ? "Sponsored" : "Ad space · 7 days"}
        </span>
      )}
      {!compact && ad && (
        <Sparkle className="absolute -top-4 left-0 z-10 size-5 fill-amber-400 text-amber-400 sm:-left-1" />
      )}

      {compact ? (
        ad ? (
          <div className="gold-surface-soft relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border-2 border-amber-300/80 px-5 py-4 pr-24 shadow-[0_12px_32px_-18px_rgba(146,105,16,0.55)] ring-1 ring-inset ring-white/70 sm:pr-40">
            {ad.backdrop_url && <AdSlotBackdrop src={ad.backdrop_url} rounded="rounded-2xl" />}
            <GoldSheen rounded="rounded-2xl" />
            {mascot && <CompactMascot src={mascot} />}
            <div className="relative flex flex-col gap-1.5">
              {/* Extra right padding on this row alone, not on the card: the
                  "Book next" chip is pinned to the top-right corner and its
                  left edge lands just inside the card's own padding, so a name
                  long enough to truncate put its ellipsis under the chip.
                  Padding the whole card instead would take the width back off
                  the description. */}
              <div className="flex items-center gap-2 pr-3 sm:pr-0">
                <CampaignAvatar
                  src={ad.image_url}
                  name={ad.name}
                  className="size-10 shrink-0 rounded-xl text-sm shadow-sm ring-2 ring-white"
                />
                <p className="min-w-0 truncate text-lg font-black tracking-tight text-amber-950 sm:text-xl">
                  {ad.name}
                </p>
              </div>
              {/* Full-strength amber rather than muted grey, and a size up from
                  the old caption: this sits on gold, often over an advertiser
                  backdrop, where anything lighter stopped being legible. */}
              <p className="line-clamp-2 text-sm font-medium leading-snug text-amber-950">
                {ad.description}
              </p>
              <a
                href={ad.destination_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-950 px-3.5 py-1.5 text-xs font-bold text-amber-50 shadow-sm transition-colors hover:bg-amber-900"
              >
                Visit site <ExternalLink className="size-3" />
              </a>
            </div>

            {/* The way into the queue while the spot is taken. Deliberately a
                small corner chip rather than a second CTA beside the
                advertiser's own: they paid for this space, and the booking
                dialog behind it already explains where in the queue a
                purchase lands. */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-950/85 px-2.5 py-1 text-[11px] font-bold text-amber-50 shadow-sm transition-colors hover:bg-amber-900"
            >
              Book next →
            </button>
          </div>
        ) : (
          <EmptyAdSlot compact onClick={() => setOpen(true)} />
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
