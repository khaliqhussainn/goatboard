import { FEATURED_BADGES } from "@/lib/featured-badges";

function BadgeTrack({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-5 pr-5 sm:gap-7 sm:pr-7"
      aria-hidden={duplicate || undefined}
    >
      {FEATURED_BADGES.map((badge) => (
        <a
          key={`${duplicate ? "duplicate-" : ""}${badge.href}`}
          href={badge.href}
          target="_blank"
          rel={badge.rel ?? "noopener noreferrer"}
          tabIndex={duplicate ? -1 : undefined}
          className="flex h-16 shrink-0 items-center justify-center rounded-2xl bg-white px-5 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.6)] ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 sm:h-[4.5rem] sm:px-6"
        >
          {/* Third-party badge artwork is intentionally loaded from its
              provider so referral marks stay current. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.src}
            alt={duplicate ? "" : badge.alt ?? `GoatBoard on ${badge.name}`}
            width={badge.width}
            height={badge.height}
            loading="lazy"
            decoding="async"
            className="h-10 w-auto max-w-none object-contain sm:h-11"
          />
        </a>
      ))}
    </div>
  );
}

export function FeaturedOnSlider() {
  return (
    <section
      aria-labelledby="featured-on-heading"
      className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white/80 py-5 shadow-[0_12px_36px_-28px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:py-6"
    >
      <div className="mb-4 flex items-center gap-3 px-5 sm:px-7">
        <span aria-hidden className="h-px flex-1 bg-black/10" />
        <h2
          id="featured-on-heading"
          className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-black/60"
        >
          Featured on
        </h2>
        <span aria-hidden className="h-px flex-1 bg-black/10" />
      </div>

      <div className="featured-badge-viewport overflow-hidden">
        <div className="featured-badge-track flex w-max items-center">
          <BadgeTrack />
          <BadgeTrack duplicate />
        </div>
      </div>
    </section>
  );
}
