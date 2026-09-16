import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The comment affordance on a board card: an icon and a count, nothing more.
 *
 * It renders through the shared Button so it is indistinguishable from Vote,
 * Boost and Share beside it - same fill, height and radius - instead of being
 * the one pale link in a row of solid black controls.
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
  size = "default",
  variant = "outline",
  className,
}: {
  slug: string;
  /** Undefined until the comments migration has been applied. */
  count?: number | null;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  // Coerced rather than trusted: the column is absent until the migration
  // runs, and "undefined comments" is a worse first impression than none.
  const total = Number(count ?? 0);
  const label = total === 0 ? "Be the first to comment" : `${total} comment${total === 1 ? "" : "s"}`;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn(
        // Square while there is nothing to count, so the bare icon doesn't
        // carry the side padding meant for a word. That reclaimed width is
        // what keeps the four actions on one line on the #1 card.
        total === 0 && (size === "sm" ? "w-8 px-0" : "w-10 px-0"),
        className,
      )}
    >
      <Link href={`/campaign/${slug}`} aria-label={label} title={label}>
        <MessageCircle />
        {total > 0 && <span className="tabular-nums">{total}</span>}
      </Link>
    </Button>
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
