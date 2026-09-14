"use client";

import { Zap } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { GET_LISTED_PROMO } from "@/lib/get-listed";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/**
 * Time left on the launch-week discount.
 *
 * Purely a display of GET_LISTED_PROMO.endsAt - the price anyone is actually
 * charged is decided server-side at checkout from the same constant, so this
 * being a second out costs nothing. Renders nothing until the browser takes
 * over, and nothing at all once the sale has ended, which is also how the
 * promotion switches itself off without a deploy.
 */
export function PromoCountdown({ className }: { className?: string }) {
  const now = useNow();
  if (now === null) return null;

  const left = Date.parse(GET_LISTED_PROMO.endsAt) - now;
  if (left <= 0) return null;

  const { d, h, m, s } = parts(left);
  const cell = (value: number, unit: string) => (
    <span className="flex items-baseline gap-0.5">
      <span className="text-base font-black tabular-nums text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-bold uppercase text-muted-foreground">{unit}</span>
    </span>
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl bg-accent-yellow/70 px-4 py-2.5 ring-1 ring-inset ring-white/60",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-yellow-900">
        <Zap className="size-3 fill-current" />
        {GET_LISTED_PROMO.label} · {GET_LISTED_PROMO.percentOff}% off
      </span>
      <span className="flex items-center gap-2">
        {cell(d, "d")}
        {cell(h, "h")}
        {cell(m, "m")}
        {cell(s, "s")}
        <span className="text-[11px] font-medium text-yellow-900">left</span>
      </span>
    </div>
  );
}
