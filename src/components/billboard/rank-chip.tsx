import { cn } from "@/lib/utils";

/** The small floating "#1" / "#2" / "#3" chip over a hero image's corner. */
export function RankChip({ rank, className }: { rank: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-white/95 px-2.5 py-1 text-sm font-black text-black shadow-md dark:bg-black/85 dark:text-white",
        className,
      )}
    >
      #{rank}
    </span>
  );
}
