"use client";

import * as React from "react";

/**
 * A once-per-second clock shared by every subscriber on the page.
 *
 * useSyncExternalStore rather than setState in an effect: the snapshot has to
 * be stable between ticks (returning Date.now() straight from the getter
 * re-renders forever), and the repo's lint rules reject setState there anyway.
 *
 * The server snapshot is null, so anything timing-related renders nothing
 * during SSR - the server has no "now" that is still true when the HTML
 * arrives, and emitting one guarantees a hydration mismatch a second later.
 */
let tick = Date.now();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (interval === null) {
    interval = setInterval(() => {
      tick = Date.now();
      for (const listener of listeners) listener();
    }, 1000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
}

/** Current time in ms, or null until the browser takes over. */
export function useNow(): number | null {
  return React.useSyncExternalStore(
    subscribe,
    () => tick,
    () => null,
  );
}
