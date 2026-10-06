"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Flame,
  Menu,
  MousePointer2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/campaign/search-bar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/activity", label: "Activity" },
  { href: "/how-it-works", label: "How it works" },
];

const SERVICES = [
  {
    href: "/get-listed",
    label: "Get Listed",
    description: "We submit your startup to relevant directories and discovery platforms.",
    image: "/get-listed-popup-goat.png",
    icon: Sparkles,
    cardClass: "bg-[#fff8dc]",
    iconClass: "bg-[#ffe88f] text-amber-700",
  },
  {
    href: "/roast",
    label: "GOAT Rant",
    description: "Turn the problem your audience feels into a sharp promotional roast.",
    image: "/mascots/goat-rant.png",
    icon: Flame,
    cardClass: "bg-[#ffe2df]",
    iconClass: "bg-[#ffb0a9] text-red-700",
  },
  {
    href: "/ui-review",
    label: "UI Review",
    description: "Get clear product design feedback with practical ways to improve your UI.",
    image: "/mascots/goat-1.webp",
    icon: MousePointer2,
    cardClass: "bg-[#e1efff]",
    iconClass: "bg-[#b8d9ff] text-blue-800",
  },
];

function ServiceCard({
  service,
  mobile = false,
  tabIndex,
}: {
  service: (typeof SERVICES)[number];
  mobile?: boolean;
  tabIndex?: number;
}) {
  const Icon = service.icon;

  return (
    <Link
      href={service.href}
      tabIndex={tabIndex}
      className={cn(
        "group/service relative overflow-hidden border border-black/5 transition-transform hover:-translate-y-0.5 hover:border-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        service.cardClass,
        mobile ? "min-h-32 rounded-xl p-3 pr-28" : "min-h-52 rounded-2xl p-4 pb-24",
      )}
    >
      <div className="relative z-10">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-full", service.iconClass)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className={cn("font-black tracking-[-0.035em]", mobile ? "mt-2 text-base" : "mt-3 text-xl")}>
          {service.label}
        </h3>
        <p className={cn("max-w-[13rem] font-medium leading-snug text-black/60", mobile ? "mt-1 text-xs" : "mt-1.5 text-[13px]")}>
          {service.description}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black">
          Explore <ArrowRight className="size-3.5 transition-transform group-hover/service:translate-x-0.5" aria-hidden />
        </span>
      </div>
      <Image
        src={service.image}
        alt=""
        width={240}
        height={240}
        className={cn(
          "pointer-events-none absolute object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.12)]",
          mobile ? "-bottom-4 -right-3 h-28 w-28" : "-bottom-8 right-0 h-32 w-32",
        )}
      />
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLElement>(null);
  const [open, setOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Auto-close on navigation — the navbar persists across route changes
  // (it lives in the root layout), so it never unmounts on its own. Adjusted
  // during render (not an effect) per React's "adjusting state when a prop
  // changes" pattern, so this doesn't cause an extra commit.
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setSearchOpen(false);
  }

  React.useEffect(() => {
    if (!open && !searchOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, searchOpen]);

  React.useEffect(() => {
    // A plain click-outside listener rather than a blocking overlay element —
    // the search field lives inline inside <nav>, so an overlay layered above
    // it (the way the mobile menu's does below) would swallow every click and
    // keystroke meant for the input itself.
    if (!searchOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [searchOpen]);

  function toggleMenu() {
    setOpen((v) => !v);
    setSearchOpen(false);
  }

  function toggleSearch() {
    setSearchOpen((v) => !v);
    setOpen(false);
  }

  return (
    <div className="sticky top-0 z-40 px-4 pt-[15px] sm:px-6">
      <nav
        ref={navRef}
        className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-2xl bg-white px-3 text-black shadow-[0_10px_30px_-14px_rgba(0,0,0,0.3)] sm:px-6"
      >
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-2 transition-opacity duration-200",
            // On a narrow phone the wordmark and an open search field can't
            // both fit, so the logo leaves the layout entirely there; from sm
            // up there's room, so it just fades in place.
            searchOpen && "hidden sm:flex sm:pointer-events-none sm:opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gb.png" alt="GOATBOARD" className="h-9 w-auto sm:h-14" />
        </Link>

        <div
          className={cn(
            // Inline from lg, not sm: the links are absolutely centred, so a
            // fourth one grew the block until it ran under the logo. Four
            // links plus the wordmark simply don't fit a tablet, and tablets
            // get the same menu button phones already use.
            "absolute left-1/2 hidden h-16 -translate-x-1/2 items-center gap-6 text-sm font-medium transition-opacity duration-200 lg:flex",
            searchOpen && "pointer-events-none opacity-0",
          )}
        >
          {NAV_LINKS.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-black transition-colors hover:text-hero-pink"
            >
              {link.label}
            </Link>
          ))}

          <div className="group/services relative flex h-16 items-center">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex items-center gap-1 text-black transition-colors hover:text-hero-pink focus-visible:outline-none focus-visible:text-hero-pink"
            >
              Services
              <ChevronDown className="size-3.5 transition-transform duration-200 group-hover/services:rotate-180 group-focus-within/services:rotate-180" aria-hidden />
            </button>

            <div className="invisible absolute left-1/2 top-full w-[760px] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility,transform] duration-200 group-hover/services:visible group-hover/services:opacity-100 group-focus-within/services:visible group-focus-within/services:opacity-100">
              <div className="rounded-[1.75rem] border border-black/10 bg-white p-3 shadow-[0_26px_70px_-28px_rgba(0,0,0,0.42)]">
                <div className="mb-3 flex items-center justify-between px-2 pt-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">GoatBoard services</p>
                    <p className="mt-0.5 text-sm font-bold">Pick the kind of help your product needs.</p>
                  </div>
                  <ArrowRight className="size-4 text-black/35" aria-hidden />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICES.map((service) => <ServiceCard key={service.href} service={service} />)}
                </div>
              </div>
            </div>
          </div>

          <Link
            href={NAV_LINKS[2].href}
            className="text-black transition-colors hover:text-hero-pink"
          >
            {NAV_LINKS[2].label}
          </Link>
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          {/* The slide-open field: a CSS grid track animated from 0fr to 1fr
              (clipped by the overflow-hidden wrapper) is what makes an
              intrinsically-sized child expand/collapse smoothly without
              knowing its pixel width up front. min-w-0 is load-bearing — as a
              flex item this would otherwise refuse to shrink below the
              field's own width, so the collapsed track never reached zero and
              pushed the whole navbar past the viewport on every phone. */}
          <div
            className={cn(
              "grid min-w-0 transition-[grid-template-columns] duration-300 ease-out",
              searchOpen ? "grid-cols-[1fr]" : "grid-cols-[0fr]",
            )}
          >
            <div className="min-w-0 overflow-hidden">
              <SearchBar
                navigation="push"
                size="minimal"
                autoFocus={searchOpen}
                className="w-52 sm:w-72"
              />
            </div>
          </div>

          {!searchOpen && (
            <Link href="/create" className="shrink-0">
              <Button size="sm">
                Create<span className="hidden sm:inline"> Campaign</span>
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSearch}
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:text-hero-pink"
          >
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>

          {!searchOpen && (
            <button
              type="button"
              onClick={toggleMenu}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav-menu"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:text-hero-pink lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
        </div>
      </nav>

      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default lg:hidden"
        />
      )}

      <div
        id="mobile-nav-menu"
        aria-hidden={!open}
        className={cn(
          "absolute inset-x-4 top-full z-40 mt-2 max-h-[calc(100vh-6rem)] origin-top overflow-y-auto rounded-2xl bg-white p-2 text-black shadow-[0_20px_50px_-16px_rgba(0,0,0,0.35)] transition-all duration-150 lg:hidden",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {NAV_LINKS.slice(0, 2).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            tabIndex={open ? undefined : -1}
            className="block rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted hover:text-hero-pink"
          >
            {link.label}
          </Link>
        ))}

        <div className="px-2 pb-1 pt-2">
          <p className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Services</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.href} service={service} mobile tabIndex={open ? undefined : -1} />
            ))}
          </div>
        </div>
        <Link
          href={NAV_LINKS[2].href}
          tabIndex={open ? undefined : -1}
          className="block rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted hover:text-hero-pink"
        >
          {NAV_LINKS[2].label}
        </Link>
      </div>
    </div>
  );
}
