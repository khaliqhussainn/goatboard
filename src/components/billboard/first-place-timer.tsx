"use client";

import { useNow } from "@/hooks/use-now";

/** The streak the badge is awarded for. Mirrors the 24 hours in
 *  sync_first_place(); the database remains the authority on the award. */
const FIRST_PLACE_TARGET_MS = 24 * 60 * 60 * 1000;

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

/**
 * How long the current #1 has held the spot, counting up to the 24-hour award.
 *
 * The clock itself lives in the database (campaigns.first_place_since), so a
 * refresh resumes where it left off instead of starting over; this only
 * renders the distance between that instant and now. Nothing renders during
 * SSR - the server has no "now" that will still be true by the time the HTML
 * arrives, so emitting a duration there guarantees a mismatch a second later.
 */
export function FirstPlaceTimer({
  since,
  awarded,
}: {
  /** ISO timestamp the campaign took #1, or null if it isn't #1. */
  since: string | null;
  /** True once the 24-hour badge has been awarded. */
  awarded: boolean;
}) {
  const now = useNow();

  if (!since || now === null) return null;

  const held = now - new Date(since).getTime();
  if (held < 0) return null;

  const pct = Math.min(100, Math.round((held / FIRST_PLACE_TARGET_MS) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {awarded ? (
          <>Holding #1 · {format(held)}</>
        ) : (
          <>
            #1 for {format(held)} ·{" "}
            <span className="text-foreground">{format(FIRST_PLACE_TARGET_MS - held)} to 24h</span>
          </>
        )}
      </span>

      {!awarded && (
        <div
          className="h-1 w-full max-w-56 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress toward the 24-hour badge"
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
