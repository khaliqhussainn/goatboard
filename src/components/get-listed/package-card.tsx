import Link from "next/link";
import { Check, Send, Sparkle, ArrowRight, Crown } from "lucide-react";
import { GET_LISTED_PROMO, promoPrice, type GetListedPackage } from "@/lib/get-listed";
import { formatMoney, cn } from "@/lib/utils";

/**
 * Per-package colour. Presentation only, so it lives here rather than in
 * lib/get-listed.ts - that file is the money config, imported by the checkout
 * route and the webhook, and has no business carrying hex codes.
 *
 * The popular package inverts to a dark card, which is the whole trick of the
 * row: the tiers either side stay light, so the eye lands on the middle one
 * without anything needing to shout.
 */
type Theme = {
  card: string;
  blob: string;
  sparkle: string;
  pill: string;
  name: string;
  tagline: string;
  panel: string;
  panelLabel: string;
  panelIcon: string;
  panelNumber: string;
  price: string;
  struck: string;
  offPill: string;
  rule: string;
  check: string;
  feature: string;
  cta: string;
  footnote: string;
  peaks: string;
};

const THEMES: Record<string, Theme> = {
  baby_goat: {
    card: "billboard-surface bg-card",
    blob: "bg-[#f9d3e2]",
    sparkle: "fill-[#f0a8c4] text-[#f0a8c4]",
    pill: "bg-[#fce7ef] text-[#8a2148]",
    name: "text-[#4a0f28]",
    tagline: "text-[#8a5a6c]",
    panel: "bg-[#fdeaf1]",
    panelLabel: "text-[#8a2148]",
    panelIcon: "bg-[#f7c6da] text-[#7a1d3f]",
    panelNumber: "text-[#5c1230]",
    price: "text-[#2b0a18]",
    struck: "text-[#b08099]",
    offPill: "bg-[#f9c9d9] text-[#7a1d3f]",
    rule: "bg-[#f1d9e3]",
    check: "bg-[#c2416f] text-white",
    feature: "text-foreground",
    cta: "bg-[#5c1230] text-white hover:bg-[#4a0f28]",
    footnote: "text-[#8a2148]",
    peaks: "text-[#d9a6bd]",
  },
  big_goat: {
    card: "bg-gradient-to-b from-[#3d1544] via-[#33113a] to-[#260c2c] shadow-[0_30px_90px_-20px_rgba(61,21,68,0.65)] ring-1 ring-inset ring-white/15",
    blob: "bg-white/10",
    sparkle: "fill-[#e9c9ff] text-[#e9c9ff]",
    pill: "bg-white/15 text-white",
    name: "text-white",
    tagline: "text-white/70",
    panel: "bg-white/10 ring-1 ring-inset ring-white/15",
    panelLabel: "text-white/70",
    panelIcon: "bg-white/20 text-white",
    panelNumber: "text-white",
    price: "text-white",
    struck: "text-white/45",
    offPill: "bg-accent-yellow text-yellow-900",
    rule: "bg-white/15",
    check: "bg-white/20 text-white",
    feature: "text-white/90",
    cta: "bg-[#ecd9ff] text-[#3d1544] hover:bg-white",
    footnote: "text-[#e9c9ff]",
    peaks: "text-white/30",
  },
  goat_mode: {
    card: "billboard-surface bg-card",
    blob: "bg-[#cdebd8]",
    sparkle: "fill-[#8fd0a8] text-[#8fd0a8]",
    pill: "bg-[#dcf1e4] text-[#14532d]",
    name: "text-[#0d3b20]",
    tagline: "text-[#4a7a5c]",
    panel: "bg-[#e6f5ec]",
    panelLabel: "text-[#14532d]",
    panelIcon: "bg-[#bfe6cd] text-[#14532d]",
    panelNumber: "text-[#0d3b20]",
    price: "text-[#082a15]",
    struck: "text-[#7ea88c]",
    offPill: "bg-[#c9e9d4] text-[#14532d]",
    rule: "bg-[#d7ebdf]",
    check: "bg-[#2f8b52] text-white",
    feature: "text-foreground",
    cta: "bg-[#14532d] text-white hover:bg-[#0d3b20]",
    footnote: "text-[#14532d]",
    peaks: "text-[#a9d7ba]",
  },
};

/** The little summit mark under the footnote — drawn rather than an asset so
 *  it takes the card's own tint. */
function Peaks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 34" aria-hidden className={cn("h-8 w-16", className)}>
      <path d="M2 32 L20 8 L30 22 L38 12 L50 32 Z" fill="currentColor" opacity="0.55" />
      <path d="M26 32 L44 4 L62 32 Z" fill="currentColor" />
      <path d="M44 4 L44 -6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PackageCard({
  pkg,
  mascot,
  popular,
  promo,
}: {
  pkg: GetListedPackage;
  /** Decorative; the card is complete without it. */
  mascot: string | null;
  popular: boolean;
  promo: boolean;
}) {
  const t = THEMES[pkg.key] ?? THEMES.baby_goat;

  return (
    // Negative margin on both ends, not just the top: the row is
    // items-stretch, so -mt alone lifts the card without making it any
    // taller, and the popular tier ends up the shortest of the three.
    <div className={cn("relative", popular && "lg:-my-6")}>
      {popular && (
        <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-b from-[#4a1a52] to-[#33113a] px-4 py-2 text-xs font-black text-white shadow-lg ring-1 ring-inset ring-white/20">
          <Crown className="size-3.5 fill-accent-yellow text-accent-yellow" />
          Most Popular
        </span>
      )}

      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6",
          t.card,
          popular && "pt-9",
        )}
      >
        {/* Mascot + how many submissions, the two things that separate the
            tiers at a glance. */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative flex size-20 shrink-0 items-end justify-center">
            <span className={cn("absolute bottom-1 size-14 rounded-full blur-[2px]", t.blob)} />
            <Sparkle className={cn("absolute right-0 top-1 size-3", t.sparkle)} />
            <Sparkle className={cn("absolute left-0 top-5 size-2", t.sparkle)} />
            {mascot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mascot} alt="" aria-hidden className="relative h-20 w-auto" />
            )}
          </div>

          <span
            className={cn(
              "mt-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
              t.pill,
            )}
          >
            {pkg.submissionTarget}+ submissions
          </span>
        </div>

        <h3 className={cn("mt-3 text-3xl font-black tracking-tight", t.name)}>{pkg.name}</h3>
        <p className={cn("mt-1 text-sm", t.tagline)}>{pkg.tagline}</p>

        <div className={cn("mt-5 flex items-center gap-4 rounded-2xl p-4", t.panel)}>
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full",
              t.panelIcon,
            )}
          >
            <Send className="size-5" />
          </span>
          <div className="min-w-0">
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.12em]", t.panelLabel)}>
              Get listed in
            </p>
            <p className={cn("text-4xl font-black leading-none tracking-tight", t.panelNumber)}>
              {pkg.submissionTarget}+
            </p>
            <p className={cn("text-sm font-semibold", t.panelLabel)}>directories</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={cn("text-4xl font-black tracking-tight tabular-nums", t.price)}>
            {formatMoney(promoPrice(pkg))}
          </span>
          {promo && (
            <span className={cn("text-xl font-bold tabular-nums line-through", t.struck)}>
              {formatMoney(pkg.priceUsd)}
            </span>
          )}
        </div>
        {promo && (
          <span
            className={cn(
              "mt-2 w-fit rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide",
              t.offPill,
            )}
          >
            {GET_LISTED_PROMO.percentOff}% off
          </span>
        )}

        <span className={cn("mt-5 h-px w-full", t.rule)} />

        <ul className="mt-5 flex flex-col gap-3">
          {pkg.includes.map((item) => (
            <li key={item} className={cn("flex items-center gap-3 text-sm", t.feature)}>
              <span
                className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", t.check)}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>

        {/* mt-auto so the button sits on the same line across all three cards
            however many features a tier lists. */}
        <Link href={`/get-listed/start?package=${pkg.key}`} className="mt-auto pt-6">
          <span
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold transition-colors",
              t.cta,
            )}
          >
            Choose {pkg.name} <ArrowRight className="size-4" />
          </span>
        </Link>

        <div className="mt-5 flex items-end justify-between gap-3">
          <p
            className={cn(
              "whitespace-pre-line font-handwritten text-sm leading-snug",
              t.footnote,
            )}
          >
            {pkg.footnote}
          </p>
          <Peaks className={t.peaks} />
        </div>
      </div>
    </div>
  );
}
