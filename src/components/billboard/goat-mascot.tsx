import { pickMascot } from "@/lib/mascots";
import { cn } from "@/lib/utils";

/**
 * A small decorative mascot sticker peeking out of a corner — brand flavor
 * only, never the campaign's own logo (see CampaignHeroImage for that).
 * Renders nothing until mascot art is configured in lib/mascots.ts.
 */
export function GoatMascot({ seed, className }: { seed: string; className?: string }) {
  const src = pickMascot(seed);
  if (!src) return null;

  return (
    <div className={cn("pointer-events-none absolute drop-shadow-lg", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-contain" />
    </div>
  );
}
