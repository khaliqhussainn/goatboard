import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The comment affordance on a board card: an icon and a count, nothing more.
 *
 * It navigates to the campaign rather than opening an input in place, which
 * is what puts the field inside the card that opens - the same intercepted
 * route the card already uses, so the feedback sits next to what it is about
 * instead of on a crowded tile.
 *
 * The count comes from campaigns.comment_count, kept by trigger, so showing
 * it costs the board nothing.
 */
export function CommentButton({
  slug,
  count,
  size = "sm",
  className,
}: {
  slug: string;
  /** Undefined until the comments migration has been applied. */
  count?: number | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  // Coerced rather than trusted: the column is absent until the migration
  // runs, and "undefined comments" is a worse first impression than none.
  const total = Number(count ?? 0);
  const label = total === 0 ? "Be the first to comment" : `${total} comment${total === 1 ? "" : "s"}`;

  return (
    <Link
      href={`/campaign/${slug}`}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        size === "lg" ? "h-12 px-4 text-base" : "h-8 px-2.5 text-[13px]",
        className,
      )}
    >
      <MessageCircle className={size === "lg" ? "size-4" : "size-3.5"} />
      {total > 0 && <span className="tabular-nums">{total}</span>}
    </Link>
  );
}

/**
 * The same affordance for a card that is already a link end to end - an
 * indicator rather than a control, because nesting a link inside a link is
 * invalid and the card itself already opens the campaign.
 */
export function CommentCount({ count, className }: { count?: number | null; className?: string }) {
  const total = Number(count ?? 0);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground", className)}
      title={total === 0 ? "No comments yet" : `${total} comment${total === 1 ? "" : "s"}`}
    >
      <MessageCircle className="size-3.5" />
      <span className="tabular-nums">{total}</span>
    </span>
  );
}
