import Link from "next/link";
import { ArrowRight, Sparkle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/** Scattered marker specks, the same trick the ad slot uses so a flat panel
 *  doesn't read as an empty rectangle. */
const SPARKLES = [
  "absolute right-5 top-4 size-3",
  "absolute left-5 top-20 size-2 xl:top-24",
  "absolute left-6 bottom-8 size-2.5",
  "absolute right-7 bottom-24 size-2 xl:bottom-40",
];

/**
 * The board's entry point into the distribution service.
 *
 * Yellow on purpose - the ad slot directly below owns purple, so a bought
 * placement and GOATBOARD's own service never read as the same thing.
 *
 * Two shapes, one component: a tall panel standing beside the spotlight once
 * the hero row goes three-up at xl, and a wide banner under the hero below
 * that, where a third column would squeeze the #1 card's actions onto two
 * rows. The goat is absolutely placed in both, so the card's height is set by
 * its copy rather than by however tall this pose happens to be.
 */
export function DistributionPromo({
  mascot,
  className,
}: {
  /** Decorative; the card is complete without it. */
  mascot?: string | null;
  className?: string;
}) {
  return (
    <Link
      href="/get-listed"
      className={cn(
        "billboard-surface group relative flex flex-col gap-3 overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#fdf6d8] via-[#fdfaec] to-[#fcf3cf] p-5 ring-1 ring-inset ring-white/70 transition-transform duration-200 hover:-translate-y-0.5",
        // Room for the goat: to the side while wide, underneath once tall.
        "pb-28 sm:pb-5 sm:pr-44 xl:pb-28 xl:pr-5",
        className,
      )}
    >
      {SPARKLES.map((cls, i) => (
        <Sparkle key={i} className={cn(cls, "fill-amber-300/70 text-amber-300/70")} aria-hidden />
      ))}

      <div className="relative flex min-w-0 flex-col items-start gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex w-fit items-center rounded-md bg-accent-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-900">
            Startup distribution
          </span>
          {/* Solid and dark against the yellow card rather than another pastel
              pill, so "this isn't finished" is the thing you notice first. */}
          <span className="inline-flex w-fit items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-background">
            <Wrench className="size-2.5" />
            Beta
          </span>
        </div>

        <h2 className="font-handwritten text-2xl uppercase leading-[1.05] tracking-tight text-foreground sm:text-3xl xl:text-2xl">
          Get your startup out there.
        </h2>

        <p className="max-w-md text-sm leading-snug text-muted-foreground">
          We manually submit your startup to relevant directories and discovery platforms so you can
          spend less time filling forms and more time building.
        </p>

        {/* Says what beta actually means here, so the badge informs instead of
            just decorating. */}
        <p className="max-w-md text-xs font-semibold leading-snug text-yellow-900">
          Still in the works - we&apos;re taking early sign-ups while we build it out.
        </p>

        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity group-hover:opacity-85">
          Learn more <ArrowRight className="size-3.5" />
        </span>
      </div>

      {mascot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mascot}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-3 right-0 h-28 w-auto drop-shadow-[0_14px_22px_rgba(133,77,14,0.28)] transition-transform duration-300 group-hover:-translate-y-1 sm:right-2 sm:h-36 xl:right-0 xl:h-32"
        />
      )}
    </Link>
  );
}
