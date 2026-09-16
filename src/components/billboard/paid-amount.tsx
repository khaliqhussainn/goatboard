import { formatMoney, paidDollars, cn } from "@/lib/utils";

/**
 * The real money behind a campaign, shown in green on its card.
 *
 * This is the one number on a tile that isn't a vanity metric - somebody paid
 * it - so it gets a colour of its own rather than sitting in the same muted
 * grey as the vote count. Green because that is what money reads as, on the
 * pale mint already in the accent palette so it stays a board card and not a
 * bank statement.
 *
 * Renders nothing at all until a campaign has taken money: an empty "$0" on
 * every unfunded card would make the board look dead and drown the few that
 * have.
 */
export function PaidAmount({
  paidPower,
  size = "sm",
  className,
}: {
  paidPower: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const dollars = paidDollars(paidPower);
  if (dollars <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-accent-green font-black tabular-nums text-green-700",
        size === "lg" ? "px-2.5 py-0.5 text-base" : "px-2 py-0.5 text-xs",
        className,
      )}
      title={`${formatMoney(dollars)} of paid Power behind this one`}
    >
      {formatMoney(dollars)}
    </span>
  );
}
