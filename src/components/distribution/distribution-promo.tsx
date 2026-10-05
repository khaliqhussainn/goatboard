"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame, MousePointer2, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ServiceSlide = {
  label: string;
  headline: string;
  subheadline?: string;
  description: string;
  cta: string;
  href: string;
  image: string | null;
  variant?: "distribution" | "rant" | "review";
};

const ROTATION_MS = 10_000;

/** Add future GoatBoard services here; the slideshow UI stays unchanged. */
const SERVICES: ServiceSlide[] = [
  {
    label: "STARTUP DISTRIBUTION",
    headline: "Get your startup out there.",
    description:
      "We manually submit your startup to relevant directories and discovery platforms so you can reach more users.",
    cta: "Learn more",
    href: "/get-listed",
    // A null image keeps using the mascot selected for the existing promo slot.
    image: null,
    variant: "distribution",
  },
  {
    label: "GOAT RANT",
    headline: "Your audience won't stop crying?",
    subheadline: "Good. I'll roast them.",
    description:
      "Turn the problem your product solves into a brutally honest promo video.",
    cta: "Get roasted",
    href: "/roast",
    image: "/mascots/goat-rant.png",
    variant: "rant",
  },
  {
    label: "UI REVIEW",
    headline: "Your UI might be the problem.",
    description:
      "Get a product designer's eyes on your product. I'll find what's confusing, weak, or costing you users.",
    cta: "Get reviewed",
    href: "/ui-review",
    image: "/mascots/goat-10.webp",
    variant: "review",
  },
];

const SPARKLES = [
  "absolute right-5 top-4 size-3",
  "absolute left-5 top-20 size-2 xl:top-24",
  "absolute left-6 bottom-8 size-2.5",
  "absolute right-7 bottom-24 size-2 xl:bottom-40",
];

const CARD_SPACING =
  "p-5 pb-28 sm:pb-5 sm:pr-44 xl:gap-2 xl:p-4 xl:pb-20 xl:pr-4";

export function DistributionPromo({
  mascot,
  className,
}: {
  /** Decorative; the first slide is complete without it. */
  mascot?: string | null;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerVersion, setTimerVersion] = useState(0);

  useEffect(() => {
    if (isPaused || SERVICES.length < 2) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % SERVICES.length);
    }, ROTATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, timerVersion]);

  function selectSlide(index: number) {
    setActiveIndex(index);
    setTimerVersion((version) => version + 1);
  }

  return (
    <section
      aria-label="GoatBoard services"
      className={cn(
        "billboard-surface group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-[#fdfaec] ring-1 ring-inset ring-white/70",
        CARD_SPACING,
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      {/* The original copy remains as an invisible sizing scaffold. Because the
          rotating layers are absolute, every service keeps these dimensions. */}
      <div aria-hidden className="invisible relative flex min-w-0 flex-col items-start gap-3 xl:gap-2">
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          Startup distribution
        </span>
        <h2 className="text-2xl font-black leading-[1.1] tracking-tight sm:text-3xl xl:text-2xl">
          Get your startup out there.
        </h2>
        <p className="max-w-md text-sm leading-snug xl:line-clamp-4">
          We manually submit your startup to relevant directories and discovery platforms so you can
          spend less time filling forms and more time building.
        </p>
        <span className="mt-1 px-4 py-2 text-sm font-bold">Learn more →</span>
      </div>

      {SERVICES.map((slide, index) => {
        const isActive = index === activeIndex;
        const isRant = slide.variant === "rant";
        const isReview = slide.variant === "review";
        const slideMascot = slide.image ?? mascot;

        return (
          <Link
            key={slide.href}
            href={slide.href}
            aria-hidden={!isActive}
            tabIndex={isActive ? undefined : -1}
            className={cn(
              "absolute inset-0 flex flex-col gap-3 overflow-hidden transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
              CARD_SPACING,
              isRant
                ? "bg-[#ffdcdc]"
                : isReview
                  ? "bg-[#ddecff]"
                  : "bg-[#fff8dc]",
              isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            {SPARKLES.map((cls, sparkleIndex) => (
              <Sparkle
                key={sparkleIndex}
                className={cn(
                  cls,
                  isRant
                    ? "fill-red-500/45 text-red-500/45"
                    : isReview
                      ? "fill-blue-400/35 text-blue-400/35"
                      : "fill-amber-300/70 text-amber-300/70",
                )}
                aria-hidden
              />
            ))}

            {isRant && (
              <span
                aria-hidden
                className="absolute right-5 top-10 rotate-6 font-black text-4xl leading-none text-orange-500/25 xl:right-3 xl:top-12"
              >
                “
              </span>
            )}

            <div className="relative z-10 flex min-w-0 flex-col items-start gap-3 xl:gap-2.5">
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] xl:px-2.5 xl:py-1",
                  isRant
                    ? "bg-[#ffaaa9] text-black"
                    : isReview
                      ? "bg-[#acd4ff] text-black"
                      : "bg-[#ffe88f] text-black",
                )}
              >
                {isRant && <Flame className="size-3.5 fill-red-500 text-red-600" aria-hidden />}
                {isReview && <MousePointer2 className="size-3.5" aria-hidden />}
                {!isRant && !isReview && <Sparkle className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />}
                {slide.label}
              </span>

              <h2
                className={cn(
                  "font-black leading-[0.98] tracking-[-0.045em] text-foreground sm:text-3xl",
                  isRant ? "text-[1.65rem] xl:text-[1.55rem]" : "text-[1.75rem] xl:text-[1.65rem]",
                )}
              >
                {isReview ? (
                  <>
                    Your UI might be{" "}
                    <span className="relative inline-block after:absolute after:-bottom-1 after:left-0 after:h-1.5 after:w-full after:-rotate-1 after:rounded-full after:bg-yellow-300">
                      <span className="relative z-10">the problem.</span>
                    </span>
                  </>
                ) : (
                  slide.headline
                )}
              </h2>

              {slide.subheadline && (
                <p className="-mt-1 text-[1.55rem] font-black leading-[0.98] tracking-[-0.04em] text-black xl:text-[1.35rem]">
                  <span className="box-decoration-clone rounded-sm bg-[#ffaaa9] px-1">
                    {slide.subheadline}
                  </span>
                </p>
              )}

              <p
                className={cn(
                  "max-w-md leading-snug text-muted-foreground",
                  "text-sm xl:text-[12px] xl:leading-[1.45]",
                )}
              >
                {slide.description}
              </p>

              <span
                className={cn(
                  "mt-1 inline-flex w-fit items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity group-hover:opacity-85 xl:px-3.5 xl:py-2 xl:text-xs",
                )}
              >
                {slide.cta}
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </div>

            {slideMascot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slideMascot}
                alt=""
                aria-hidden
                className={cn(
                  "pointer-events-none absolute right-0 w-auto transition-transform duration-300 group-hover:-translate-y-1",
                  isRant
                    ? "-bottom-3 h-36 drop-shadow-[0_14px_22px_rgba(154,52,18,0.22)] sm:right-4 sm:h-40 xl:-bottom-2 xl:right-0 xl:h-28"
                    : isReview
                      ? "-bottom-3 h-36 drop-shadow-[0_14px_22px_rgba(30,64,175,0.16)] sm:left-4 sm:right-auto sm:h-40 xl:-bottom-1 xl:left-2 xl:right-auto xl:h-24"
                      : "-bottom-3 h-32 drop-shadow-[0_14px_22px_rgba(133,77,14,0.28)] sm:right-2 sm:h-36 xl:right-0 xl:h-24",
                )}
              />
            )}

            {isRant && (
              <>
                <Flame className="pointer-events-none absolute bottom-16 left-4 size-7 fill-red-500 text-red-500 xl:bottom-12 xl:size-6" aria-hidden />
                <Flame className="pointer-events-none absolute bottom-8 left-10 size-4 fill-red-400 text-red-400 xl:bottom-7" aria-hidden />
              </>
            )}

            {isReview && (
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-1 z-10 w-[74px] rotate-3 rounded-md border border-black/10 bg-white p-2 shadow-sm sm:right-3 sm:w-24 xl:right-1 xl:w-16 xl:p-1.5"
              >
                <p className="text-[8px] font-black uppercase leading-none xl:text-[7px]">UI Review</p>
                <div className="mt-1.5 space-y-1">
                  {[0, 1, 2].map((line) => (
                    <div key={line} className="flex items-center gap-1">
                      <span className="flex size-2.5 items-center justify-center border border-black xl:size-2">
                        <Check className="size-2 xl:size-1.5" />
                      </span>
                      <span className="h-1 flex-1 rounded-full bg-black/35" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Link>
        );
      })}

      <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 xl:bottom-2">
        {SERVICES.map((slide, index) => (
          <button
            key={slide.href}
            type="button"
            aria-label={`Show ${slide.label}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => selectSlide(index)}
            className={cn(
              "size-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none",
              index === activeIndex
                ? "w-4 bg-foreground/75"
                : "bg-foreground/25 hover:bg-foreground/45",
            )}
          />
        ))}
      </div>
    </section>
  );
}
