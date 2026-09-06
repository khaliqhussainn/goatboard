import { cn } from "@/lib/utils";

/**
 * Permanent bragging rights: shown on any campaign that has ever reached
 * #1, even long after it's been overtaken.
 */
export function GoatBadge({
  size = "s",
  className,
}: {
  size?: "s" | "xs";
  className?: string;
}) {
  return (
    <span
      title="Once reached #1 on GOATBOARD"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pregoat.png"
        alt="Once reached #1"
        className={size === "s" ? "h-7 w-auto" : "h-6 w-auto"}
      />
    </span>
  );
}
