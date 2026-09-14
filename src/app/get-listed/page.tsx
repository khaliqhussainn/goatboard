import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Zap,
  FileText,
  Search,
  Send,
  BarChart3,
} from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Button } from "@/components/ui/button";
import {
  GET_LISTED_PACKAGE_LIST,
  GET_LISTED_STEPS,
  GET_LISTED_DISCLOSURES,
} from "@/lib/get-listed";
import { pickHourlyMascot } from "@/lib/mascots";
import { formatMoney, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Get Listed",
  description:
    "We submit your startup to relevant directories and discovery platforms so you can spend less time filling forms and more time building.",
};

const STEP_ICONS = { FileText, Search, Send, BarChart3 } as const;

/** Pastel circle per step, cycling the accent palette. */
const STEP_ACCENTS = [
  "bg-accent-yellow text-yellow-800",
  "bg-accent-purple text-purple-700",
  "bg-accent-green text-green-700",
  "bg-accent-pink text-red-500",
];

const HERO_STATS = [
  { value: "30+", label: "Directories", chip: "bg-accent-blue text-blue-700" },
  { value: "Manual", label: "Submissions", chip: "bg-accent-yellow text-yellow-800" },
  { value: "Tracked", label: "Every listing", chip: "bg-accent-green text-green-700" },
];

/** The small uppercase pill that introduces each section. */
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-900">
      <Zap className="size-3 fill-current" />
      {children}
    </span>
  );
}

export default function GetListedPage() {
  const mascot = pickHourlyMascot();
  const popularKey = "big_goat";

  return (
    <div className="on-backdrop">
      <AbstractBackdrop />

      {/* ------------------------------------------------------------- Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)] lg:gap-8">
        <div className="flex flex-col items-start gap-5">
          <SectionTag>Get listed</SectionTag>

          <h1 className="font-rounded text-4xl font-black uppercase leading-[1.02] tracking-[-0.01em] sm:text-5xl lg:text-[2.35rem] xl:text-[2.7rem]">
            Get your startup out there.
          </h1>

          <p className="max-w-md text-base text-muted-foreground">
            We submit your startup to relevant directories and discovery platforms so you can spend
            less time filling forms and more time building.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/get-listed/start">
              <Button size="lg" variant="abstract">
                Start a campaign <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border border-border bg-card text-foreground hover:bg-muted hover:opacity-100">
                See how it works
              </Button>
            </a>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-start gap-1">
                <dd
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-black tracking-tight",
                    stat.chip,
                  )}
                >
                  {stat.value}
                </dd>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* The illustration carries the whole "we submit it everywhere" idea,
            so nothing is rebuilt around it in markup. Cut out rather than
            boxed, so it reads as sitting on the page instead of on a lighter
            rectangle of its own. Its size comes from the grid rather than a
            negative margin: bleeding into the gutter scrolled the page
            sideways everywhere between 1024px and 1280px, where the container
            is already as wide as the viewport allows. Only 2xl has gutter to
            spare. */}
        <div className="relative 2xl:-mr-[6%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/herogetlisted.png"
            alt="A GOATBOARD distribution machine feeding a startup out to directories, launch sites and founder communities"
            width={1676}
            height={794}
            className="h-auto w-full 2xl:w-[112%] 2xl:max-w-none"
          />
        </div>
      </section>

      {/* ----------------------------------------------------- How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-card/70 py-12 backdrop-blur-sm sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <SectionTag>How it works</SectionTag>
          <h2 className="mt-4 font-rounded text-3xl font-black uppercase leading-tight tracking-[-0.01em] sm:text-4xl">
            You build. We submit.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            A simple process. Real submissions. More visibility.
          </p>

          <ol className="mt-10 grid w-full grid-cols-1 gap-x-4 gap-y-8 text-left sm:grid-cols-2 lg:grid-cols-4">
            {GET_LISTED_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[step.icon];
              return (
                <li key={step.step} className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black",
                        STEP_ACCENTS[i % STEP_ACCENTS.length],
                      )}
                    >
                      {step.step}
                    </span>
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        STEP_ACCENTS[i % STEP_ACCENTS.length],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </div>

                  <h3 className="text-base font-black tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>

                  {/* Connector, only where the steps actually sit side by side. */}
                  {i < GET_LISTED_STEPS.length - 1 && (
                    <ArrowRight
                      aria-hidden
                      className="absolute -right-3 top-4 hidden size-4 text-muted-foreground lg:block"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- Packages */}
      <section id="packages" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col items-start gap-3">
          <SectionTag>Our packages</SectionTag>
          <h2 className="font-rounded text-3xl font-black uppercase leading-tight tracking-[-0.01em] sm:text-4xl">
            Pick your goat
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Choose the package that fits your goals. All plans include manual submissions, relevant
            directories and a final report.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GET_LISTED_PACKAGE_LIST.map((pkg) => {
            const popular = pkg.key === popularKey;
            return (
              <div
                key={pkg.key}
                className={cn(
                  "relative flex flex-col gap-4 rounded-[1.75rem] p-6",
                  popular
                    ? "billboard-surface-lg bg-gradient-to-b from-[#fdf8e3] to-[#fdfbf2] ring-2 ring-accent-yellow lg:-mt-4 lg:pb-10"
                    : "billboard-surface",
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-yellow px-3 py-1 text-[10px] font-bold text-yellow-900">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  {mascot && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mascot} alt="" aria-hidden className="h-10 w-auto shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{pkg.summary}</p>
                  </div>
                </div>

                <div className="text-4xl font-black tracking-tight tabular-nums">
                  {formatMoney(pkg.priceUsd)}
                </div>

                <ul className="flex flex-1 flex-col gap-2">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/get-listed/start?package=${pkg.key}`} className="mt-auto">
                  <Button
                    variant={popular ? "abstract" : "outline"}
                    className={cn(
                      "w-full",
                      !popular &&
                        "border border-border bg-card text-foreground hover:bg-muted hover:opacity-100",
                    )}
                  >
                    Choose {pkg.name}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* What the packages do and don't promise. Same text as the Terms. */}
        <details className="billboard-surface mt-6 rounded-[1.75rem] p-5">
          <summary className="cursor-pointer text-sm font-bold">
            What you&apos;re buying (and what isn&apos;t guaranteed)
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {GET_LISTED_DISCLOSURES.map((line) => (
              <li key={line} className="text-sm text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* -------------------------------------------------------- Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="billboard-surface relative flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#f3ecfd] via-[#f7f2fe] to-[#f3ecfd] px-6 py-10 text-center ring-1 ring-inset ring-white/70 sm:px-10">
          {mascot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mascot}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-4 hidden h-32 w-auto lg:block"
            />
          )}

          <SectionTag>Ready to get started?</SectionTag>
          <p className="font-rounded text-2xl font-black leading-tight tracking-[-0.01em] sm:text-3xl">
            Get your startup discovered.
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Choose a package and let us handle the submissions.
          </p>
          <Link href="/get-listed/start">
            <Button size="lg" variant="abstract">
              Start a campaign <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
