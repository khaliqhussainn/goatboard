import { cn } from "@/lib/utils";

// Rotates through the pastel accent set instead of defaulting to yellow —
// yellow is one option among five, never the fallback identity color.
const FALLBACK_COLORS = [
  "bg-accent-pink",
  "bg-accent-blue",
  "bg-accent-purple",
  "bg-accent-green",
  "bg-accent-yellow",
];

function fallbackColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export function CampaignAvatar({
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
      <div className={cn("relative overflow-hidden rounded-xl bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl font-black text-black",
        fallbackColor(name || "?"),
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
