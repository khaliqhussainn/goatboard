import { SplashReady } from "@/components/layout/splash-ready";

/**
 * The branded loading screen shown on every cold open and refresh.
 *
 * Rendered by the root layout rather than through app/loading.tsx, because a
 * Suspense fallback is only emitted when the render actually suspends - the
 * production build resolves these pages before the first flush, so that route
 * never put a splash in the HTML at all. Rendering it in the layout puts it
 * in the first byte of every response instead, so it paints with the page.
 *
 * It is plain markup plus CSS, so it is visible before any JavaScript has
 * run. SplashReady takes it away again at hydration; the CSS carries a
 * fallback so a browser that never runs the script is not left staring at it.
 */

/** Brand colours, in the order they bounce. */
const DOTS = [
  "var(--hero-pink)",
  "var(--hero-yellow)",
  "var(--hero-green)",
  "var(--hero-blue)",
  "var(--hero-purple)",
];

export function SplashScreen() {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-background"
      >
        {/* Colour wash, pinned to the corners so it never sits behind the
            wordmark - logo-gb.png has no alpha channel, and a blob passing
            under it would turn its white backing into a visible rectangle. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span
            className="splash-blob absolute -left-28 -top-24 size-[24rem] rounded-full opacity-60 blur-3xl sm:size-[32rem]"
            style={{ background: "var(--blob-coral)" }}
          />
          <span
            className="splash-blob absolute -right-28 -top-16 size-[22rem] rounded-full opacity-55 blur-3xl sm:size-[30rem]"
            style={{ background: "var(--blob-yellow)", animationDelay: "-3s" }}
          />
          <span
            className="splash-blob absolute -bottom-28 -left-16 size-[22rem] rounded-full opacity-50 blur-3xl sm:size-[30rem]"
            style={{ background: "var(--blob-teal)", animationDelay: "-6s" }}
          />
          <span
            className="splash-blob absolute -bottom-24 -right-20 size-[22rem] rounded-full opacity-50 blur-3xl sm:size-[30rem]"
            style={{ background: "var(--blob-purple)", animationDelay: "-4.5s" }}
          />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-gb.png"
          alt=""
          width={2168}
          height={725}
          // multiply, because logo-gb.png has no alpha: over colour its white
          // backing would otherwise read as a hard rectangle around the mark.
          className="relative h-11 w-auto mix-blend-multiply sm:h-16"
        />

        <div className="relative flex items-end gap-2">
          {DOTS.map((color, i) => (
            <span
              key={color}
              className="splash-dot size-3 rounded-full sm:size-3.5"
              style={{ background: color, animationDelay: `${i * 110}ms` }}
            />
          ))}
        </div>

        <span className="sr-only">Loading GOATBOARD</span>
      </div>

      <SplashReady />
    </>
  );
}
