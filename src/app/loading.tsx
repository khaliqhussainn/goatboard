import { GoatboardLoader } from "@/components/layout/splash-screen";

/**
 * Reuses the cold-open artwork while a route's server content is delayed.
 * Next swaps this fallback out automatically as soon as the page is ready.
 */
export default function Loading() {
  return (
    <GoatboardLoader className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-7 bg-background" />
  );
}
