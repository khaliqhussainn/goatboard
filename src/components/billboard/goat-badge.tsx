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
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pregoat.png"
        alt="Once reached #1"
        className={size === "sm" ? "h-5 w-auto" : "h-4 w-auto"}
      />
    </span>
  );
}
