import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Permanent bragging rights: shown on any campaign that has ever reached
 * #1, even long after it's been overtaken. Set once by the database
 * (campaigns.has_been_goat, see the mark_goat trigger) and never cleared.
 */
export function GoatBadge({ size = "sm", className }: { size?: "sm" | "xs"; className?: string }) {
  return (
    <span
      title="Once reached #1 on GOATBOARD"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-gold font-bold text-gold-foreground",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]",
        className,
      )}
    >
      <Crown className={size === "sm" ? "size-3" : "size-2.5"} />
      GOAT
    </span>
  );
}
