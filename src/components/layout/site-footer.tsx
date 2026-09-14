import Link from "next/link";
import { XLogo } from "@/components/icons/x-logo";

/**
 * Site footer. Internal routes use Link so navigation stays client-side;
 * anything that isn't a real route yet is deliberately absent rather than
 * linked to a page that 404s.
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GOATBOARD. There is one spot everyone wants.
          </p>
          <a
            href="https://x.com/goatboardlol"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GOATBOARD on X"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <XLogo className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
