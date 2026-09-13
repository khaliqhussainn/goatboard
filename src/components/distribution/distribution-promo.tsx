import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";

/**
 * The board's entry point into the distribution service. Sits between the
 * spotlight row and the ranked cards, deliberately below the paid ad slot so
 * it never competes with inventory someone bought.
 *
 * Styled as one of the board's own tiles rather than a banner, so it reads as
 * part of the product instead of an advert for it.
 */
export function DistributionPromo() {
  return (
    <Link
      href="/distribution"
      className="billboard-surface group mt-4 flex flex-col items-start gap-3 rounded-[1.75rem] p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-purple text-purple-600 transition-transform duration-200 group-hover:scale-105">
        <Send className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Distribution service
          </span>
        </div>
        <p className="text-lg font-black tracking-tight">Get your startup out there.</p>
        <p className="text-sm text-muted-foreground">
          We submit your startup to relevant directories and discovery platforms - and list it right
          here on the board.
        </p>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity group-hover:opacity-85">
        See plans <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
