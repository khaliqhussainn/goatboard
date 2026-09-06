import { cn } from "@/lib/utils";

// Deterministic per-campaign gradient — only ever seen as the fallback when
// a campaign has no logo at all (the logo itself now covers the full area).
const HERO_GRADIENTS = [
  "from-blob-navy to-blob-purple",
  "from-blob-orange to-blob-yellow",
  "from-blob-teal to-blob-navy",
  "from-blob-coral to-blob-purple",
  "from-blob-yellow to-blob-orange",
  "from-blob-purple to-blob-coral",
];

function heroGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return HERO_GRADIENTS[Math.abs(hash) % HERO_GRADIENTS.length];
}

/**
 * The big image area on the spotlight and #2/#3 tiles. When the campaign
 * has a logo/image, it fills the entire area edge-to-edge (object-cover,
 * no padding or box around it). Only falls back to a colorful generated
 * gradient + monogram when there's no image at all.
 */
export function CampaignHeroImage({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br",
        heroGradient(name || "?"),
        className,
      )}
    >
      <span className="text-5xl font-black text-white/90 drop-shadow-sm sm:text-6xl">
        {(name || "?").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
