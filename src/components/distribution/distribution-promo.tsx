"use client";

import Link from "next/link";
import { Sparkle } from "lucide-react";
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
  variant?: "distribution" | "rant";
};

const ROTATION_MS = 10_000;

/** Add future GoatBoard services here; the slideshow UI stays unchanged. */
const SERVICES: ServiceSlide[] = [
  {
    label: "STARTUP DISTRIBUTION ✦",
    headline: "Get your startup out there.",
    description:
      "We manually submit your startup to relevant directories and discovery platforms.",
    cta: "Learn more →",
    href: "/get-listed",
    // A null image keeps using the mascot selected for the existing promo slot.
    image: null,
    variant: "distribution",
  },
  {
    label: "🔥 GOAT RANT",
    headline: "Your audience won't stop crying?",
    subheadline: "Good. I'll roast them.",
    description:
      "Turn the problem your product solves into a brutally honest promo video.",
    cta: "Get roasted →",
    href: "/roast",
    image: "/mascots/goat-rant.png",
    variant: "rant",
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
                ? "bg-[#fff1e7]"
                : "bg-gradient-to-b from-[#fdf6d8] via-[#fdfaec] to-[#fcf3cf]",
              isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            {SPARKLES.map((cls, sparkleIndex) => (
              <Sparkle
                key={sparkleIndex}
                className={cn(
                  cls,
                  isRant
                    ? "fill-orange-400/55 text-orange-400/55"
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

            <div className="relative flex min-w-0 flex-col items-start gap-3 xl:gap-2">
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                  isRant ? "bg-orange-500 text-white" : "bg-accent-yellow text-yellow-900",
                )}
              >
                {slide.label}
              </span>

              <h2
                className={cn(
                  "font-black leading-[1.1] tracking-tight text-foreground sm:text-3xl",
                  isRant ? "text-[1.35rem] xl:text-xl" : "text-2xl xl:text-2xl",
                )}
              >
                {slide.headline}
              </h2>

              {slide.subheadline && (
                <p className="-mt-1 text-lg font-black leading-tight text-orange-600 xl:text-base">
                  {slide.subheadline}
                </p>
              )}

              <p
                className={cn(
                  "max-w-md leading-snug text-muted-foreground",
                  isRant ? "text-[13px] xl:text-xs" : "text-sm xl:line-clamp-4",
                )}
              >
                {slide.description}
              </p>

              <span
                className={cn(
                  "mt-1 inline-flex w-fit items-center rounded-xl px-4 py-2 text-sm font-bold transition-opacity group-hover:opacity-85",
                  isRant ? "bg-orange-600 text-white" : "bg-foreground text-background",
                )}
              >
                {slide.cta}
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
                    ? "-bottom-2 h-32 drop-shadow-[0_14px_22px_rgba(154,52,18,0.22)] sm:right-4 sm:h-40 xl:-bottom-1 xl:right-0 xl:h-28"
                    : "-bottom-3 h-28 drop-shadow-[0_14px_22px_rgba(133,77,14,0.28)] sm:right-2 sm:h-36 xl:right-0 xl:h-24",
                )}
              />
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
