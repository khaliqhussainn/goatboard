import { cn } from "@/lib/utils";

/**
 * Awarded for holding #1 for 24 consecutive hours. Like the GOAT badge it is
 * permanent - losing the spot afterwards doesn't take it back - so it renders
 * from held_24h_at being set rather than from current rank.
 */
export function StreakBadge({
  size = "s",
  className,
}: {
  size?: "s" | "xs";
  className?: string;
}) {
  return (
    <span
      title="Held #1 on GOATBOARD for 24 hours straight"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/24hr.png"
        alt="Held #1 for 24 hours"
        className={size === "s" ? "h-7 w-auto" : "h-6 w-auto"}
      />
    </span>
  );
}
