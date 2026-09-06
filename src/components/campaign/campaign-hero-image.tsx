import { cn } from "@/lib/utils";

// Deterministic per-campaign gradient so the hero area always looks
// intentional and colorful, even when the campaign's own logo is a tiny
// favicon — the gradient is the "art," the logo sits on top of it like a sticker.
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
 * The big image area on the spotlight and #2/#3 tiles — shows the
 * campaign's own logo/image (auto-fetched or uploaded), centered on a
 * colorful generated background so it never looks like an empty box.
 * Rounding is left to the caller via className.
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
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br",
        heroGradient(name || "?"),
        className,
      )}
    >
      {src ? (
        <div className="flex size-[55%] items-center justify-center rounded-2xl bg-white/95 p-3 shadow-lg dark:bg-black/85">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="size-full object-contain" />
        </div>
      ) : (
        <span className="text-5xl font-black text-white/90 drop-shadow-sm sm:text-6xl">
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
