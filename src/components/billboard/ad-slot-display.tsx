"use client";

import * as React from "react";
import { Plus, Sparkle, ExternalLink } from "lucide-react";
import { AdSlotForm } from "@/components/billboard/ad-slot-form";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentAd } from "@/lib/types";

export function AdSlotDisplay({ ad }: { ad: CurrentAd | null }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <span className="absolute -top-3 left-7 z-10 inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
        🐐 {ad ? "Sponsored" : "Ad space · 7 days"}
      </span>
      <Sparkle className="absolute -top-4 left-0 z-10 size-5 fill-purple-300 text-purple-300 sm:-left-1" />
      <span className="absolute -top-4 right-8 z-10 -rotate-12 text-amber-400 sm:right-14">
        <BurstMark />
      </span>

      {ad ? (
        <div className="relative overflow-hidden rounded-[4rem] border-2 border-purple-200 bg-purple-50 px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
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
          className="group relative w-full overflow-hidden rounded-[4rem] border-2 border-dashed border-purple-300 bg-purple-50 px-8 py-10 text-left transition-colors hover:border-purple-400 hover:bg-purple-100/60 sm:px-12"
        >
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="relative flex shrink-0 items-end gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mascots/goat-1.webp" alt="" className="h-24 w-auto sm:h-28" />
              <span className="relative -mb-1 rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 font-handwritten text-sm text-purple-700 shadow-sm">
                Your logo here
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 text-purple-400 transition-colors group-hover:border-purple-500 group-hover:text-purple-500">
                <Plus className="size-7" />
              </span>
              <p className="font-handwritten text-2xl leading-tight text-purple-700 sm:text-3xl">
                Your product
                <br />
                <span className="underline decoration-purple-400 decoration-wavy decoration-2 underline-offset-4">
                  could be here
                </span>
              </p>
            </div>

            <div className="billboard-surface-sm relative w-full max-w-[220px] shrink-0 rounded-2xl p-4 text-left">
              <Sparkle className="absolute -right-2.5 -top-2.5 size-4 fill-purple-300 text-purple-300" />
              <p className="font-bold text-foreground">
                Product Name
                <span className="ml-0.5 animate-pulse text-purple-400">|</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Short description of what your product does.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                Visit →
              </span>
            </div>
          </div>
        </button>
      )}

      {!ad && (
        <p className="mt-2 text-center font-handwritten text-base text-purple-500 sm:text-lg">
          ↖ Rent this spot →
        </p>
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

/** A little three-stroke "spark" burst — the yellow accent marks in the reference. */
function BurstMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path d="M4 6 L8 10" />
      <path d="M4 14 L8 12" />
      <path d="M4 21 L9 16" />
    </svg>
  );
}
