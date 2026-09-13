import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderSearch,
  Crosshair,
  Crown,
  ListChecks,
  CircleCheck,
  FileText,
  Check,
  ArrowRight,
  Sparkles,
  Wrench,
} from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DistributionDashboard } from "@/components/distribution/distribution-dashboard";
import {
  DISTRIBUTION_PACKAGES,
  DISTRIBUTION_BOOST,
  DISTRIBUTION_INCLUDES,
  DISTRIBUTION_STEPS,
  DISTRIBUTION_CONTACT,
  SAMPLE_CAMPAIGN,
} from "@/lib/distribution";
import { pickHourlyMascot } from "@/lib/mascots";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Distribution",
  description:
    "We manually submit your startup to relevant directories and discovery platforms, so you can spend less time hunting for listings and more time building.",
};

const INCLUDE_ICONS = {
  FolderSearch,
  Crosshair,
  Crown,
  ListChecks,
  CircleCheck,
  FileText,
} as const;

/** Pastel chip colours, matching the accent pairs used across the board. */
const ACCENT_CHIPS = {
  blue: "bg-accent-blue text-blue-600",
  purple: "bg-accent-purple text-purple-600",
  yellow: "bg-accent-yellow text-yellow-700",
  green: "bg-accent-green text-green-600",
  pink: "bg-accent-pink text-red-500",
} as const;

const HERO_STATS = [
  { value: "100+", label: "relevant platforms" },
  { value: "6", label: "channel types" },
  { value: "1", label: "GOATBOARD listing" },
];

const ADVANTAGE_ROWS = [
  { label: "Your startup, on the board", body: "A public campaign page from day one." },
  { label: "Votes and Power", body: "Free daily votes climb you up the ranking." },
  { label: "One link to share", body: "Point every new visitor at the same page." },
];

/** Eyebrow label above each section heading. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </span>
  );
}

export default function DistributionPage() {
  const mascot = pickHourlyMascot();

  return (
    <div className="on-backdrop mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AbstractBackdrop />

      {/* Hero */}
      <section className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <div className="flex flex-col items-start gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">Distribution service</Badge>
            {/* Carried through from the promo card - someone who clicks in
                shouldn't lose the "this isn't finished yet" signal. */}
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-background">
              <Wrench className="size-3" />
              Beta
            </span>
          </div>

          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Get your startup{" "}
            <span className="relative whitespace-nowrap">
              out there.
              {/* The hand-drawn underline the brand uses for emphasis. */}
              <svg
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-hero-purple"
              >
                <path
                  d="M2 8c40-5 92-6 196-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            We manually submit your startup to relevant directories and discovery platforms, so you
            can spend less time hunting for listings and more time building.
          </p>

          <p className="flex max-w-md items-start gap-2 rounded-xl bg-accent-yellow/60 px-3 py-2 text-sm font-semibold text-yellow-900">
            <Wrench className="mt-0.5 size-4 shrink-0" />
            <span>
              This service is still in the works. Get in touch to join the first round - we&apos;ll
              confirm scope and timing with you before anything is charged.
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href={DISTRIBUTION_CONTACT}>
              <Button size="lg" variant="abstract">
                Get Started <ArrowRight className="size-4" />
              </Button>
            </a>
            <a href="#whats-included">
              <Button size="lg" variant="outline">
                See What&apos;s Included
              </Button>
            </a>
          </div>

          <dl className="flex flex-wrap gap-2 sm:gap-3">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="billboard-surface-sm flex min-w-0 items-baseline gap-1.5 rounded-2xl px-3 py-2"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black tracking-tight tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Campaign snapshot as the hero visual: it shows the work being done
            rather than describing it, which is the whole pitch. */}
        <div className="relative">
          {mascot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mascot}
              alt=""
              aria-hidden
              // Overflows the card's bottom-right, the way the ad slot's goat
              // does. Above the card it sat under the sticky navbar and got
              // beheaded; over the header it covered the campaign reference.
              // The report link on that row is left-aligned, so this corner is
              // free. lg only - the narrower stacked card has no spare corner.
              className="pointer-events-none absolute -bottom-5 right-5 z-10 hidden h-28 w-auto drop-shadow-[0_14px_22px_rgba(88,28,135,0.28)] lg:block"
            />
          )}
          <DistributionDashboard campaign={SAMPLE_CAMPAIGN} />
        </div>
      </section>

      {/* What's included */}
      <section id="whats-included" className="mt-14 scroll-mt-24 sm:mt-20">
        <div className="flex flex-col gap-2">
          <Eyebrow>What you get</Eyebrow>
          <h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
            One startup. A whole lot of places.
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            We get your startup in front of the right people across the web - not a scattergun blast
            at every list that exists.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {DISTRIBUTION_INCLUDES.map((item) => {
            const Icon = INCLUDE_ICONS[item.icon];
            return (
              <div
                key={item.title}
                className="billboard-surface group flex flex-col gap-3 rounded-[1.75rem] p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-6"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                    ACCENT_CHIPS[item.accent],
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14 sm:mt-20">
        <div className="flex flex-col gap-2">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Put your distribution on autopilot.
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {DISTRIBUTION_STEPS.map((step, i) => (
            <div key={step.step} className="relative flex">
              <div className="billboard-surface flex flex-1 flex-col gap-2 rounded-[1.75rem] p-5 sm:p-6">
                <span className="text-3xl font-black tracking-tight tabular-nums text-hero-purple">
                  {step.step}
                </span>
                <h3 className="text-lg font-black tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
              {/* Connector between steps, desktop only - stacked on a phone the
                  cards already read top-to-bottom without help. */}
              {i < DISTRIBUTION_STEPS.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-hero-purple sm:block"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-14 sm:mt-20">
        <div className="flex flex-col gap-2">
          <Eyebrow>Choose your plan</Eyebrow>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Simple pricing. Big visibility.
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Pick the plan that fits your goals. Every package includes your GOATBOARD listing.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DISTRIBUTION_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                "relative flex flex-col gap-4 rounded-[1.75rem] p-6",
                // The popular tier lifts out of the row rather than only
                // changing colour, so the hierarchy survives on a phone where
                // the cards are stacked and can't be compared side by side.
                pkg.popular
                  ? "billboard-surface-lg ring-2 ring-hero-purple sm:-mt-3 sm:pb-9"
                  : "billboard-surface",
              )}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-hero-purple px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="size-3" /> Most popular
                </span>
              )}

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black tracking-tight">{pkg.name}</h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {pkg.submissions}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tight tabular-nums">${pkg.price}</span>
                <span className="text-sm font-medium text-muted-foreground">one-time</span>
              </div>

              <p className="text-sm text-muted-foreground">{pkg.tagline}</p>

              <ul className="flex flex-1 flex-col gap-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <span className="min-w-0">{feature}</span>
                  </li>
                ))}
              </ul>

              <a href={pkg.href} className="mt-auto">
                <Button size="lg" variant="abstract" className="w-full">
                  Get Started <ArrowRight className="size-4" />
                </Button>
              </a>
            </div>
          ))}
        </div>

        {/* The add-on reads as a wide band rather than a fourth column, so it
            doesn't compete with the three packages it attaches to. */}
        <div className="billboard-surface mt-4 flex flex-col gap-4 rounded-[1.75rem] bg-gradient-to-br from-purple-50 via-white to-purple-100 p-6 ring-1 ring-inset ring-white/70 sm:mt-5 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black tracking-tight">{DISTRIBUTION_BOOST.name}</h3>
              <Badge variant="purple">Add-on</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{DISTRIBUTION_BOOST.body}</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
              {DISTRIBUTION_BOOST.features.map((feature) => (
                <li key={feature} className="flex items-center gap-1.5 text-sm">
                  <Check className="size-4 shrink-0 text-purple-600" />
                  <span className="min-w-0">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <a href={DISTRIBUTION_BOOST.href} className="shrink-0">
            <Button size="lg" variant="abstract" className="w-full sm:w-auto">
              Talk to us <ArrowRight className="size-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* GOATBOARD advantage */}
      <section className="mt-14 sm:mt-20">
        <div className="billboard-surface-lg relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col items-start gap-3">
              <Eyebrow>The GOATBOARD advantage</Eyebrow>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Distribution that ends somewhere real.
              </h2>
              <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
                Most submission services hand you a spreadsheet and disappear. Every distribution
                package puts your startup on GOATBOARD itself - a public page with votes, Power and
                a shot at the #1 spotlight - so you have one place to send people while we handle
                the wider discovery.
              </p>
              <Link href="/how-it-works">
                <Button variant="outline">
                  See how the board works <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {ADVANTAGE_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 rounded-2xl border border-border p-4"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-yellow text-yellow-700">
                    <Crown className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{row.label}</p>
                    <p className="text-sm text-muted-foreground">{row.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="billboard-surface-lg relative mt-14 overflow-hidden rounded-[2rem] px-6 py-10 sm:mt-20 sm:px-10 sm:py-14">
        {mascot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mascot}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-4 right-2 hidden h-40 w-auto opacity-90 drop-shadow-[0_14px_22px_rgba(88,28,135,0.28)] lg:block"
          />
        )}
        <div className="flex flex-col items-start gap-4 lg:max-w-2xl">
          <Eyebrow>Ready to get started?</Eyebrow>
          <p className="font-handwritten text-3xl leading-tight text-purple-700 sm:text-4xl">
            Ready to get your startup out there?
          </p>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Let GOATBOARD handle the submissions while you focus on building.
          </p>
          <a href={DISTRIBUTION_CONTACT}>
            <Button size="lg" variant="abstract">
              Get My Startup Out There <ArrowRight className="size-4" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
