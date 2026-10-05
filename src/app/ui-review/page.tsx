import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleUserRound,
  FileCheck2,
  FileText,
  ImageIcon,
  Lightbulb,
  Link2,
  ListChecks,
  Mail,
  MousePointer2,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "UI Review",
  description:
    "Get a clear, practical UI review with annotated screenshots and prioritized recommendations from a product designer.",
};

const CONTACT_URL = "https://x.com/mrymonx";

const REVIEW_FEATURES = [
  {
    title: "Full walkthrough",
    body: "A complete review of your landing page or product.",
    icon: MousePointer2,
    accent: "bg-accent-pink",
  },
  {
    title: "What’s working",
    body: "Clear strengths so you can keep doing the right things.",
    icon: ListChecks,
    accent: "bg-accent-yellow",
  },
  {
    title: "What to improve",
    body: "Confusing parts, weak sections, and missed opportunities.",
    icon: TriangleAlert,
    accent: "bg-accent-pink",
  },
  {
    title: "Actionable suggestions",
    body: "Practical ideas you can actually implement.",
    icon: Lightbulb,
    accent: "bg-accent-green",
  },
  {
    title: "Annotated screenshots",
    body: "Visual examples with notes and explanations.",
    icon: ImageIcon,
    accent: "bg-accent-blue",
  },
  {
    title: "Prioritized recommendations",
    body: "Focus on what will have the biggest impact.",
    icon: ListChecks,
    accent: "bg-accent-purple",
  },
  {
    title: "Designed for indie teams",
    body: "Simple, no-fluff feedback you can act on quickly.",
    icon: CircleUserRound,
    accent: "bg-accent-blue",
  },
];

const PLANS = [
  {
    key: "landing",
    name: "Landing Page Review",
    price: "$49",
    features: [
      "Detailed PDF report (8–12 pages)",
      "Full landing page review",
      "Annotated screenshots",
      "Actionable suggestions",
    ],
  },
  {
    key: "product",
    name: "Full Product Review",
    price: "$99",
    popular: true,
    features: [
      "Detailed PDF report (12–20 pages)",
      "Full product or MVP review",
      "UX, design, onboarding, key flows",
      "Prioritized recommendations",
    ],
  },
  {
    key: "design",
    name: "Review + Design Suggestions",
    price: "$149",
    features: [
      "Detailed PDF report (20+ pages)",
      "Full review + design recommendations",
      "Annotated screenshots",
      "Optional redesigned screen concepts",
    ],
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function HeroArtwork() {
  return (
    <div aria-hidden className="relative mx-auto h-[360px] w-full max-w-[620px] sm:h-[430px]">
      <div className="absolute bottom-12 right-0 top-8 flex w-[74%] rotate-[0.8deg] flex-col overflow-hidden rounded-2xl border-2 border-[#0b172a] bg-white shadow-[0_18px_35px_-28px_rgba(0,0,0,0.45)]">
        <div className="flex h-9 items-center gap-2 bg-[#081526] px-4">
          <span className="size-2 rounded-full bg-[#ff665c]" />
          <span className="size-2 rounded-full bg-[#ffd45a]" />
          <span className="size-2 rounded-full bg-white" />
          <span className="ml-auto h-1.5 w-8 rounded-full bg-white/15" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[0.85fr_1.15fr] gap-5 p-7">
          <div className="rounded-xl border border-black/10 bg-neutral-100 p-3">
            <div className="flex h-full items-center justify-center rounded-lg border border-black/10 bg-white">
              <ImageIcon className="size-12 text-black/10" />
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <div className="h-3 w-4/5 rounded-full bg-black/10" />
            <div className="h-3 w-full rounded-full bg-black/10" />
            <div className="h-3 w-2/3 rounded-full bg-black/10" />
            <div className="h-10 w-28 rounded-md bg-[#081526]" />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="h-14 rounded-md bg-black/5" />
              <div className="h-14 rounded-md bg-black/10" />
            </div>
          </div>
        </div>
        <span className="absolute right-[18%] top-[29%] size-14 rounded-full border-[4px] border-[#f6bf20]" />
        <span className="absolute right-[8%] top-[42%] h-1 w-20 rotate-[15deg] rounded-full bg-[#f6bf20]" />
        <span className="absolute bottom-[25%] right-[13%] size-16 rounded-full border-[4px] border-[#ff625f]" />
      </div>

      <div className="absolute left-[4%] top-[15%] -rotate-[8deg] rounded-md bg-accent-yellow px-4 py-3 text-sm font-black leading-tight shadow-sm">
        Confusing
        <br />
        hierarchy?
      </div>
      <div className="absolute right-[-2%] top-[24%] rotate-[5deg] rounded-md bg-accent-yellow px-4 py-3 text-sm font-black leading-tight shadow-sm">
        Make this
        <br />
        clearer!
      </div>
      <div className="absolute right-0 top-[48%] rotate-[2deg] rounded-md bg-accent-pink px-4 py-3 text-sm font-black leading-tight shadow-sm">
        Stronger
        <br />
        CTA here?
      </div>

      <Image
        src="/mascots/goat-1.webp"
        alt=""
        width={256}
        height={256}
        priority
        className="absolute -bottom-1 left-[5%] h-[59%] w-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)] sm:left-[8%] sm:h-[64%]"
      />

      <div className="absolute bottom-3 left-[35%] z-10 w-32 rotate-[1deg] rounded-md border-2 border-[#0b172a] bg-white p-3 shadow-sm sm:w-36">
        <p className="text-center text-xs font-black uppercase">UI Review</p>
        <div className="mt-2 space-y-2">
          {["Hierarchy", "CTA", "Clarity"].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <span className="flex size-3.5 items-center justify-center border border-black">
                <Check className="size-2.5" />
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-black/45" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroBenefit({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-yellow">
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-semibold leading-tight text-muted-foreground">{children}</span>
    </div>
  );
}

function ReportPage({ type }: { type: "cover" | "summary" | "working" | "improve" | "suggestions" }) {
  if (type === "cover") {
    return (
      <div className="relative flex h-full flex-col overflow-hidden p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-gb.png" alt="" className="h-5 w-fit" />
        <p className="mt-5 text-2xl font-black leading-[0.9] tracking-[-0.04em]">
          UI Review
          <br />
          Report
        </p>
        <p className="mt-4 text-[9px] font-semibold">yourproduct.com</p>
        <p className="text-[9px] text-muted-foreground">March 2026</p>
        <Image
          src="/mascots/goat-7.webp"
          alt=""
          width={256}
          height={256}
          className="absolute -bottom-5 -right-8 h-36 w-auto"
        />
      </div>
    );
  }

  const config = {
    summary: { number: "01", title: "Executive Summary", color: "text-black" },
    working: { number: "02", title: "What’s Working", color: "text-emerald-500" },
    improve: { number: "03", title: "Areas to Improve", color: "text-red-500" },
    suggestions: { number: "04", title: "Design Suggestions", color: "text-amber-500" },
  }[type];

  return (
    <div className="flex h-full flex-col p-5">
      <p className={`text-xl font-black ${config.color}`}>{config.number}</p>
      <p className="mt-2 text-xs font-black">{config.title}</p>
      <div className="mt-4 space-y-2">
        {["w-full", "w-5/6", "w-3/4", "w-full"].map((width, index) => (
          <div key={`${width}-${index}`} className="flex items-center gap-2">
            {type !== "summary" && (
              <span
                className={`flex size-3 items-center justify-center rounded-full text-[8px] font-black ${
                  type === "working"
                    ? "bg-accent-green text-emerald-700"
                    : type === "improve"
                      ? "bg-accent-pink text-red-600"
                      : "bg-accent-yellow text-amber-700"
                }`}
              >
                {type === "working" ? "✓" : type === "improve" ? "!" : "•"}
              </span>
            )}
            <span className={`h-1.5 rounded-full bg-black/10 ${width}`} />
          </div>
        ))}
      </div>

      {type === "summary" && (
        <div className="mt-auto rounded-lg bg-accent-yellow/55 p-3">
          <p className="text-[9px] font-bold">Overall score</p>
          <p className="text-xl font-black">7.5/10</p>
        </div>
      )}
      {type === "working" && (
        <div className="mt-auto rounded-lg border border-black/10 bg-neutral-50 p-2">
          <div className="h-8 rounded bg-white shadow-sm" />
        </div>
      )}
      {type === "improve" && (
        <div className="relative mt-auto h-16 rounded-lg border border-black/10 bg-neutral-50">
          <span className="absolute bottom-2 left-1/2 h-4 w-16 -translate-x-1/2 rounded-[50%] border-2 border-red-400" />
        </div>
      )}
      {type === "suggestions" && (
        <div className="mt-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="h-12 rounded-md bg-black/15" />
          <ArrowRight className="size-3" />
          <div className="h-12 rounded-md bg-accent-purple" />
        </div>
      )}
    </div>
  );
}

export default function UiReviewPage() {
  return (
    <div className="bg-[#fbfaf7] text-black">
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-12 sm:px-6 sm:pb-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:pt-14">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-yellow px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
              <ScanSearch className="size-3.5" />
              GoatBoard · UI Review
            </span>

            <h1 className="mt-4 text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              Your UI might be
              <span className="mt-1 block w-fit rounded-md bg-accent-yellow px-2 pb-1">
                the problem.
              </span>
            </h1>

            <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              Get a product designer&apos;s eyes on your product. I&apos;ll find what&apos;s confusing,
              weak, or costing you users.
            </p>

            <a
              href="#pricing"
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-base font-extrabold text-white transition-transform hover:-translate-y-0.5"
            >
              Get my UI reviewed <ArrowRight className="size-4" />
            </a>

            <div className="mt-7 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-xl">
              <HeroBenefit icon={FileText}>Detailed PDF report</HeroBenefit>
              <HeroBenefit icon={Lightbulb}>Actionable suggestions</HeroBenefit>
              <HeroBenefit icon={CircleUserRound}>Built for founders &amp; indie teams</HeroBenefit>
            </div>
          </div>

          <HeroArtwork />
        </section>

        <section className="border-y border-black/5 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <SectionEyebrow>What you’ll get</SectionEyebrow>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                A clear, practical and honest UI review
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                I&apos;ll explore your landing page or product, highlight what&apos;s working, what&apos;s
                confusing, and give you specific recommendations to improve it.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {REVIEW_FEATURES.slice(0, 4).map(({ title, body, icon: Icon, accent }) => (
                <article key={title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <span className={`flex size-11 items-center justify-center rounded-full ${accent}`}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEW_FEATURES.slice(4).map(({ title, body, icon: Icon, accent }) => (
                <article key={title} className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accent}`}>
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative text-center">
              <SectionEyebrow>Example report</SectionEyebrow>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                A sneak peek inside the review
              </h2>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Here are a few sample pages from a real UI review report.
              </p>
              <span className="mt-4 inline-block -rotate-2 rounded-md bg-accent-yellow px-4 py-2 text-sm font-black lg:absolute lg:right-3 lg:top-5 lg:mt-0">
                Delivered as a PDF report
              </span>
            </div>

            <div className="pretty-scroll mt-8 flex snap-x gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
              {(["cover", "summary", "working", "improve", "suggestions"] as const).map((type) => (
                <article
                  key={type}
                  className="aspect-[0.76] w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm sm:w-[240px] lg:w-auto lg:shrink"
                >
                  <ReportPage type={type} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-accent-yellow/25 p-5 sm:p-7">
            <div className="text-center">
              <SectionEyebrow>Pick a plan</SectionEyebrow>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Simple pricing for founders
              </h2>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl border bg-white p-5 ${
                    plan.popular ? "border-[#efbd22]" : "border-black/5"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#f2bd1d] px-3 py-1 text-[10px] font-black">
                      Most Popular
                    </span>
                  )}
                  <h3 className="pr-24 text-lg font-black">{plan.name}</h3>
                  <p className="mt-1 text-3xl font-black">{plan.price}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-black" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={CONTACT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 lg:mt-auto lg:translate-y-1"
                  >
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <SectionEyebrow>How it works</SectionEyebrow>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Get your review in 3 simple steps
              </h2>
            </div>

            <ol className="mt-8 grid gap-7 md:grid-cols-3">
              {[
                {
                  icon: Link2,
                  title: "1. Submit your product",
                  body: "Share your website or product link and a few details.",
                },
                {
                  icon: FileCheck2,
                  title: "2. I review it",
                  body: "I’ll analyze your product and prepare a detailed PDF report.",
                },
                {
                  icon: Mail,
                  title: "3. Get your report",
                  body: "You’ll receive the PDF report via email, usually within 3–5 days.",
                },
              ].map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                  {index < 2 && (
                    <ArrowRight className="absolute -right-4 top-4 hidden size-5 text-black/15 md:block" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="relative mx-auto min-h-56 max-w-6xl overflow-hidden rounded-3xl bg-accent-yellow/35 p-6 sm:p-9">
            <div className="relative z-10 max-w-2xl">
              <SectionEyebrow>Ready to improve your UI?</SectionEyebrow>
              <h2 className="mt-2 text-3xl font-black leading-[1] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Let&apos;s make your product clearer,
                <br className="hidden sm:block" /> smoother and more effective.
              </h2>
              <a
                href="#pricing"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
              >
                Get my UI reviewed <ArrowRight className="size-4" />
              </a>
            </div>

            <Image
              src="/mascots/goat-17.webp"
              alt=""
              width={256}
              height={256}
              className="absolute -bottom-8 right-2 h-44 w-auto sm:right-[8%] sm:h-52"
            />
            <p className="absolute right-5 top-7 hidden -rotate-[8deg] text-xl font-black leading-tight sm:block">
              Better
              <br />
              products
              <br />
              win
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
