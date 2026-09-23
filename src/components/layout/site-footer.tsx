import Link from "next/link";
import { XLogo } from "@/components/icons/x-logo";

/** Who built it, and where to find them. Edit here, not in the markup. */
const FOUNDER = { name: "Maryam", xHandle: "mrymonx" };

/**
 * Directories that have featured us, shown as their own badge artwork.
 *
 * The image is served from the lister rather than copied into public/ - it is
 * their mark, and they get to restyle it. It is fixed-size and lazy so a slow
 * third party can neither shift the footer nor hold up the page.
 */
const FEATURED_ON = [
  {
    name: "Nick Launches",
    href: "https://nicklaunches.com/products/goatboard/?utm_source=goatboard.lol&utm_medium=badge&utm_campaign=featured",
    // A 480x112 retina asset, rendered at 171x40 - comfortably above 1x.
    src: "https://nicklaunches.com/badges/featured-dark.png",
    width: 244,
    height: 56,
  },
  {
    name: "Indie Chains",
    href: "https://indiechains.com",
    // An SVG at exactly the rendered height, so the intrinsic size here is
    // only reserving the box before it loads.
    src: "https://api.indiechains.com/badge/7304bc433fcf589d5a3283e9c4be846d0dfe4f5594a6ce3a.svg?theme=dark",
    width: 180,
    height: 40,
  },
];

/**
 * Columns of the site footer. Internal routes use Link so navigation stays
 * client-side; anything that isn't a real route yet is deliberately absent
 * rather than linked to a page that 404s.
 */
const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Get Listed", href: "/get-listed" },
      { label: "How it works", href: "/how-it-works" },
      { label: "My campaigns", href: "/my-campaigns" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/60 py-10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <Link href="/" className="w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-gb.png" alt="GOATBOARD" className="h-9 w-auto" />
            </Link>
            <p className="max-w-xs text-xs text-muted-foreground">
              One public billboard, one #1 spotlight - plus a distribution service that gets your
              startup in front of the rest of the web.
            </p>

            <div className="mt-2 flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Goatboard is featured on
              </h2>
              {/* h-10 rather than something chunkier: at h-14 the two badges
                  measured 240px and 252px against a 446px column and wrapped
                  onto separate lines at every width. They still wrap on a
                  phone, which is the right call down there. */}
              <div className="flex flex-wrap items-center gap-3">
                {FEATURED_ON.map((badge) => (
                  <a
                    key={badge.href}
                    href={badge.href}
                    target="_blank"
                    // Not "noreferrer": the listing counts referrals from here,
                    // and noopener alone is what closes the security hole.
                    rel="noopener"
                    className="w-fit transition-opacity hover:opacity-80"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={badge.src}
                      alt={`Goatboard on ${badge.name}`}
                      width={badge.width}
                      height={badge.height}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-auto max-w-full"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {column.heading}
              </h2>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GOATBOARD. There is one spot everyone wants.
          </p>

          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span>
              Built by <span className="font-semibold text-foreground">{FOUNDER.name}</span>
            </span>
            <a
              href={`https://x.com/${FOUNDER.xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${FOUNDER.name} on X (@${FOUNDER.xHandle})`}
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <XLogo className="size-3.5" />
              <span>@{FOUNDER.xHandle}</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
