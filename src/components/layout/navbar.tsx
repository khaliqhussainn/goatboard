"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/campaign/search-bar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/mine", label: "My Campaigns" },
  { href: "/how-it-works", label: "How it works" },
];

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
        className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-2xl bg-white px-4 text-black shadow-[0_10px_30px_-14px_rgba(0,0,0,0.3)] sm:px-6"
      >
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-2 transition-opacity duration-200",
            searchOpen && "pointer-events-none opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gb.png" alt="GOATBOARD" className="h-14 w-auto" />
        </Link>

        <div
          className={cn(
            "absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm font-medium transition-opacity duration-200 sm:flex",
            searchOpen && "pointer-events-none opacity-0",
          )}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-black transition-colors hover:text-hero-pink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          {/* The slide-open field: a CSS grid track animated from 0fr to 1fr
              (clipped by the overflow-hidden wrapper) is what makes an
              intrinsically-sized child expand/collapse smoothly without
              knowing its pixel width up front. */}
          <div
            className={cn(
              "grid transition-[grid-template-columns] duration-300 ease-out",
              searchOpen ? "grid-cols-[1fr]" : "grid-cols-[0fr]",
            )}
          >
            <div className="min-w-0 overflow-hidden">
              <SearchBar
                navigation="push"
                size="minimal"
                autoFocus={searchOpen}
                className="w-56 sm:w-72"
              />
            </div>
          </div>

          {!searchOpen && (
            <Link href="/create">
              <Button size="sm">Create Campaign</Button>
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
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:text-hero-pink sm:hidden"
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
          className="fixed inset-0 z-30 cursor-default sm:hidden"
        />
      )}

      <div
        id="mobile-nav-menu"
        aria-hidden={!open}
        className={cn(
          "absolute inset-x-4 top-full z-40 mt-2 origin-top rounded-2xl bg-white p-2 text-black shadow-[0_20px_50px_-16px_rgba(0,0,0,0.35)] transition-all duration-150 sm:hidden",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            tabIndex={open ? undefined : -1}
            className="block rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted hover:text-hero-pink"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
