import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";

function ReviewIllustration() {
  return (
    <div aria-hidden className="relative h-44 w-full sm:h-52 lg:h-full">
      <div className="absolute inset-x-8 bottom-1 top-3 flex rotate-[1.5deg] flex-col overflow-hidden rounded-2xl border border-black/80 bg-white sm:left-24 sm:right-4 lg:left-20">
        <div className="flex h-7 items-center gap-1.5 border-b border-black/70 bg-black px-3">
          <span className="size-1.5 rounded-full bg-white/55" />
          <span className="size-1.5 rounded-full bg-white/55" />
          <span className="size-1.5 rounded-full bg-white/55" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.1fr] gap-3 p-4">
          <div className="rounded-lg border border-black/20 bg-neutral-100 p-2">
            <div className="h-full rounded-md border border-dashed border-black/25 bg-white" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-2.5 w-4/5 rounded-full bg-black/75" />
            <div className="h-2 w-full rounded-full bg-black/15" />
            <div className="h-2 w-3/4 rounded-full bg-black/15" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="h-8 rounded-md border border-black/15 bg-neutral-100" />
              <div className="h-8 rounded-md bg-accent-yellow" />
            </div>
          </div>
        </div>

        <span className="absolute right-[23%] top-[31%] size-10 rounded-full border-[3px] border-[#f1bd22]" />
        <span className="absolute right-[9%] top-[44%] h-0.5 w-14 rotate-[18deg] bg-[#f1bd22] after:absolute after:-right-0.5 after:-top-1 after:size-2 after:rotate-45 after:border-r-2 after:border-t-2 after:border-[#f1bd22]" />
      </div>

      <div className="absolute right-2 top-0 rotate-[5deg] rounded-md border border-black/15 bg-accent-yellow px-3 py-2 text-[10px] font-black leading-tight shadow-sm sm:right-0 sm:top-2">
        CLARIFY
        <span className="mt-1 block h-0.5 w-9 bg-black/70" />
        <span className="mt-1 block h-0.5 w-6 bg-black/35" />
      </div>

      <Image
        src="/mascots/goat-10.webp"
        alt=""
        width={256}
        height={256}
        className="absolute -bottom-2 left-0 h-[88%] w-auto object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.12)] sm:left-2 lg:-left-2"
      />

      <span className="absolute bottom-5 left-[31%] h-2 w-16 -rotate-[18deg] rounded-full bg-accent-yellow sm:left-[34%]" />
      <span className="absolute bottom-8 left-[45%] size-2 rotate-45 bg-black" />
    </div>
  );
}

export function UiReviewBanner() {
  return (
    <section
      aria-labelledby="ui-review-heading"
      className="mt-6 overflow-hidden rounded-3xl border border-black/75 bg-white px-5 py-5 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.45)] sm:px-7 sm:py-6 lg:h-64 lg:px-9 lg:py-7"
    >
      <div className="grid h-full items-center gap-5 lg:grid-cols-[1.16fr_0.84fr] lg:gap-8">
        <div className="relative z-10 flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-yellow px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black sm:text-xs">
            <ScanSearch className="size-3.5" aria-hidden />
            GoatBoard · UI Review
          </span>

          <h2
            id="ui-review-heading"
            className="mt-2 text-3xl font-black leading-[0.96] tracking-[-0.045em] text-black sm:text-4xl lg:whitespace-nowrap lg:text-[2.1rem] xl:text-[2.6rem]"
          >
            Your UI might be <span className="bg-accent-yellow px-1">the problem.</span>
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground xl:text-base">
            Get a product designer&apos;s eyes on your product. I&apos;ll find what&apos;s confusing,
            weak, or costing you users.
          </p>

          <Link
            href="/ui-review"
            className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Get my UI reviewed <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <ReviewIllustration />
      </div>
    </section>
  );
}
