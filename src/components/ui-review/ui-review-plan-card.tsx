import Image from "next/image";
import { Check, Crown, FileText, Sparkle } from "lucide-react";
import { UiReviewCheckoutDialog } from "@/components/ui-review/ui-review-checkout-dialog";
import type { UiReviewPlanKey } from "@/lib/ui-review";
import { cn } from "@/lib/utils";

type UiReviewPlan = {
  key: UiReviewPlanKey;
  name: string;
  priceUsd: number;
  features: readonly string[];
  popular: boolean;
};

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
  rule: string;
  check: string;
  feature: string;
  cta: string;
  footnote: string;
  peaks: string;
};

const PLAN_DETAILS: Record<
  UiReviewPlanKey,
  { tagline: string; pages: string; mascot: string; footnote: string }
> = {
  landing: {
    tagline: "A focused review for the page doing your selling.",
    pages: "8–12",
    mascot: "/mascots/goat-10.webp",
    footnote: "Best for landing pages\nand early launches",
  },
  product: {
    tagline: "A deeper look at your product, flows and onboarding.",
    pages: "12–20",
    mascot: "/mascots/goat-17.webp",
    footnote: "Best for live products\nand growing teams",
  },
  design: {
    tagline: "Review findings paired with practical design direction.",
    pages: "20+",
    mascot: "/mascots/goat-15.webp",
    footnote: "Best when you want\nthe next design move",
  },
};

const THEMES: Record<UiReviewPlanKey, Theme> = {
  landing: {
    card: "billboard-surface bg-card",
    blob: "bg-[#cde7ff]",
    sparkle: "fill-[#78baff] text-[#78baff]",
    pill: "bg-[#dceeff] text-[#245b89]",
    name: "text-[#102f4d]",
    tagline: "text-[#52718b]",
    panel: "bg-[#eaf5ff]",
    panelLabel: "text-[#32678f]",
    panelIcon: "bg-[#c9e5ff] text-[#245b89]",
    panelNumber: "text-[#123f63]",
    price: "text-[#0c2c46]",
    rule: "bg-[#d9e9f6]",
    check: "bg-[#327bb4] text-white",
    feature: "text-foreground",
    cta: "bg-[#123f63] text-white hover:bg-[#0c2c46]",
    footnote: "text-[#32678f]",
    peaks: "text-[#9cccf1]",
  },
  product: {
    card: "bg-gradient-to-b from-[#17294a] via-[#111f3a] to-[#0b172d] shadow-[0_30px_90px_-20px_rgba(11,23,45,0.65)] ring-1 ring-inset ring-white/15",
    blob: "bg-white/10",
    sparkle: "fill-[#ffe17a] text-[#ffe17a]",
    pill: "bg-white/15 text-white",
    name: "text-white",
    tagline: "text-white/70",
    panel: "bg-white/10 ring-1 ring-inset ring-white/15",
    panelLabel: "text-white/65",
    panelIcon: "bg-white/15 text-white",
    panelNumber: "text-white",
    price: "text-white",
    rule: "bg-white/15",
    check: "bg-white/20 text-white",
    feature: "text-white/90",
    cta: "bg-[#dceeff] text-[#102f4d] hover:bg-white",
    footnote: "text-[#bcdcff]",
    peaks: "text-white/30",
  },
  design: {
    card: "billboard-surface bg-card",
    blob: "bg-[#ffe7a8]",
    sparkle: "fill-[#f3bf2e] text-[#f3bf2e]",
    pill: "bg-[#fff1c7] text-[#795b05]",
    name: "text-[#493704]",
    tagline: "text-[#7d6b36]",
    panel: "bg-[#fff5d8]",
    panelLabel: "text-[#806313]",
    panelIcon: "bg-[#ffe7a2] text-[#795b05]",
    panelNumber: "text-[#4f3b04]",
    price: "text-[#3b2c03]",
    rule: "bg-[#efe2bd]",
    check: "bg-[#d09d0c] text-white",
    feature: "text-foreground",
    cta: "bg-[#5b4506] text-white hover:bg-[#453504]",
    footnote: "text-[#806313]",
    peaks: "text-[#dfc675]",
  },
};

function Peaks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 34" aria-hidden className={cn("h-8 w-16", className)}>
      <path d="M2 32 L20 8 L30 22 L38 12 L50 32 Z" fill="currentColor" opacity="0.55" />
      <path d="M26 32 L44 4 L62 32 Z" fill="currentColor" />
      <path d="M44 4 L44 -6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function UiReviewPlanCard({ plan }: { plan: UiReviewPlan }) {
  const theme = THEMES[plan.key];
  const details = PLAN_DETAILS[plan.key];

  return (
    <div className={cn("relative", plan.popular && "lg:-my-6")}>
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#111f3a] px-4 py-2 text-xs font-black text-white shadow-lg ring-1 ring-inset ring-white/20">
          <Crown className="size-3.5 fill-accent-yellow text-accent-yellow" /> Most Popular
        </span>
      )}

      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6",
          theme.card,
          plan.popular && "pt-9",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="relative flex size-20 shrink-0 items-end justify-center">
            <span className={cn("absolute bottom-1 size-14 rounded-full blur-[2px]", theme.blob)} />
            <Sparkle className={cn("absolute right-0 top-1 size-3", theme.sparkle)} />
            <Sparkle className={cn("absolute left-0 top-5 size-2", theme.sparkle)} />
            <Image
              src={details.mascot}
              alt=""
              aria-hidden
              width={96}
              height={96}
              className="relative h-20 w-auto object-contain"
            />
          </div>

          <span className={cn("mt-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold", theme.pill)}>
            PDF review
          </span>
        </div>

        <h3 className={cn("mt-3 text-3xl font-black tracking-tight", theme.name)}>{plan.name}</h3>
        <p className={cn("mt-1 text-sm", theme.tagline)}>{details.tagline}</p>

        <div className={cn("mt-5 flex items-center gap-4 rounded-2xl p-4", theme.panel)}>
          <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", theme.panelIcon)}>
            <FileText className="size-5" />
          </span>
          <div>
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.12em]", theme.panelLabel)}>
              Detailed report
            </p>
            <p className={cn("text-4xl font-black leading-none tracking-tight", theme.panelNumber)}>
              {details.pages}
            </p>
            <p className={cn("text-sm font-semibold", theme.panelLabel)}>pages</p>
          </div>
        </div>

        <p className={cn("mt-5 text-4xl font-black tracking-tight tabular-nums", theme.price)}>
          ${plan.priceUsd}
        </p>

        <span className={cn("mt-5 h-px w-full", theme.rule)} />

        <ul className="mt-5 flex flex-col gap-3">
          {plan.features.map((feature) => (
            <li key={feature} className={cn("flex items-center gap-3 text-sm", theme.feature)}>
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", theme.check)}>
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          <UiReviewCheckoutDialog
            planKey={plan.key}
            planName={plan.name}
            priceUsd={plan.priceUsd}
            triggerLabel={`Choose ${plan.name}`}
            triggerClassName={theme.cta}
          />
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <p className={cn("whitespace-pre-line font-handwritten text-sm leading-snug", theme.footnote)}>
            {details.footnote}
          </p>
          <Peaks className={theme.peaks} />
        </div>
      </article>
    </div>
  );
}
