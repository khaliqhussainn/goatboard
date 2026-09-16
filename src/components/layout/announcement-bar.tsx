import Link from "next/link";
import { ArrowRight, Sparkle } from "lucide-react";

/**
 * The thin strip above the navbar pointing at the distribution service.
 *
 * Deliberately one line: it sits above the board on every page, so anything
 * taller would push the #1 spotlight down the screen on a phone for the sake
 * of an advert for ourselves. The wording is cut down on small screens rather
 * than wrapped, for the same reason.
 */
export function AnnouncementBar() {
  return (
    <Link
      href="/get-listed"
      className="group block bg-foreground px-4 py-1.5 text-center text-background transition-opacity hover:opacity-90"
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[12px] sm:text-[13px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-yellow-900">
          <Sparkle className="size-2.5 fill-current" />
          Done for you
        </span>

        <span className="font-semibold">
          We pitch your startup to 100+ directories
          <span className="hidden sm:inline"> while you get on with building</span>
        </span>

        <span className="inline-flex items-center gap-0.5 font-bold underline underline-offset-4 transition-transform group-hover:translate-x-0.5">
          Get listed <ArrowRight className="size-3" />
        </span>
      </span>
    </Link>
  );
}
