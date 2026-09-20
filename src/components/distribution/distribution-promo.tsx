import Link from "next/link";
import { ArrowRight, Sparkle } from "lucide-react";
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
        "billboard-surface group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-[#fdf6d8] via-[#fdfaec] to-[#fcf3cf] p-5 ring-1 ring-inset ring-white/70 transition-transform duration-200 hover:-translate-y-0.5",
        // Room for the goat: to the side while wide, underneath once tall.
        // The xl reserve is kept tight on purpose - this promo is the tallest
        // thing in the hero row, so whatever it asks for is the height the #1
        // spotlight beside it gets stretched to, and every pixel of that it
        // doesn't need opens a gap above the spotlight's buttons.
        "pb-28 sm:pb-5 sm:pr-44 xl:gap-2 xl:p-4 xl:pb-20 xl:pr-4",
        className,
      )}
    >
      {SPARKLES.map((cls, i) => (
        <Sparkle key={i} className={cn(cls, "fill-amber-300/70 text-amber-300/70")} aria-hidden />
      ))}

      <div className="relative flex min-w-0 flex-col items-start gap-3 xl:gap-2">
        <span className="inline-flex w-fit items-center rounded-md bg-accent-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-900">
          Startup distribution
        </span>

        {/* Plain sans, same as every other heading on the board ("Nobody's the
            GOAT yet.", the campaign names): the handwritten face this used to
            run in was the only one of its kind up here and read as a sticker
            dropped onto the layout rather than part of it. */}
        <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-foreground sm:text-3xl xl:text-2xl">
          Get your startup out there.
        </h2>

        {/* Clamped only in the narrow xl column, where this wraps to six lines
            and is the single biggest contributor to the row's height. */}
        <p className="max-w-md text-sm leading-snug text-muted-foreground xl:line-clamp-4">
          We manually submit your startup to relevant directories and discovery platforms so you can
          spend less time filling forms and more time building.
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
          className="pointer-events-none absolute -bottom-3 right-0 h-28 w-auto drop-shadow-[0_14px_22px_rgba(133,77,14,0.28)] transition-transform duration-300 group-hover:-translate-y-1 sm:right-2 sm:h-36 xl:right-0 xl:h-24"
        />
      )}
    </Link>
  );
}
