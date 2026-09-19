"use client";

import * as React from "react";
import { Maximize, ExternalLink, Film } from "lucide-react";
import { VideoAdForm } from "@/components/billboard/video-ad-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CurrentVideoAd } from "@/lib/types";

/**
 * The paid video spot: a continuously-looping muted clip with a small
 * fullscreen toggle (native Fullscreen API on the <video> element itself,
 * so it keeps playing rather than being replaced by a lightbox) and a link
 * to the advertiser's site. Same open/dialog shape as AdSlotDisplay's empty
 * state, styled dark instead of gold so it doesn't read as the same slot.
 *
 * Sized as its own compact 16:9 box on a phone, where it stacks alone. Beside
 * the ad slot (sm+) it instead fills whatever the row gives it — height
 * matched to the ad slot via the parent's fixed row height, width via
 * flex-1 — so the pair reads as one unbroken rectangle rather than a small
 * video floating in leftover space. object-cover keeps the clip itself
 * looking right regardless of the box's resulting ratio.
 */
export function VideoAdDisplay({
  videoAd,
  className,
}: {
  videoAd: CurrentVideoAd | null;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  function toggleFullscreen() {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }

  return (
    <div className={cn("relative", className)}>
      {videoAd ? (
        <div className="group relative mx-auto aspect-video h-40 w-auto max-w-full overflow-hidden rounded-2xl bg-black shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/10 sm:mx-0 sm:aspect-auto sm:h-full sm:w-full">
          <video
            ref={videoRef}
            src={videoAd.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="size-full object-cover"
          />
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
            Sponsored
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            className="absolute bottom-2 left-2 inline-flex items-center justify-center rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <Maximize className="size-3.5" />
          </button>
          <a
            href={videoAd.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black shadow-sm transition-colors hover:bg-white/90"
          >
            Visit <ExternalLink className="size-3" />
          </a>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mx-auto flex aspect-video h-40 w-auto max-w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-white/15 bg-black/90 text-center shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)] transition-colors hover:border-white/30 sm:mx-0 sm:aspect-auto sm:h-full sm:w-full"
        >
          <Film className="size-5 text-white/50" />
          <p className="text-lg font-black tracking-tight text-white/90">Your video could be here</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black shadow-sm transition-colors group-hover:bg-white/90">
            $10 · 7 days →
          </span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent the video spot</DialogTitle>
          </DialogHeader>
          <VideoAdForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
