import { XLogo } from "@/components/icons/x-logo";
import { cn } from "@/lib/utils";

export function XHandleLink({ handle, className }: { handle: string; className?: string }) {
  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1 font-semibold text-muted-foreground transition-colors hover:text-hero-pink",
        className,
      )}
    >
      <XLogo className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">@{handle}</span>
    </a>
  );
}
