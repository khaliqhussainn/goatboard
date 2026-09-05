import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact power formatting: 1240 -> "1,240", 12400 -> "12.4K". */
export function formatPower(value: number): string {
  if (value < 10_000) {
    return value.toLocaleString("en-US");
  }
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function powerBreakdown(paidPower: number, votePower: number): string {
  const dollars = Math.round(paidPower / 3);
  const votes = votePower.toLocaleString("en-US");
  const votesLabel = votePower === 1 ? "vote" : "votes";
  if (dollars <= 0) return `${votes} ${votesLabel}`;
  return `${formatMoney(dollars)} · ${votes} ${votesLabel}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
