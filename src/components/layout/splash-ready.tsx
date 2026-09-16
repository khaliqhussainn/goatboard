"use client";

import * as React from "react";

/**
 * Dismisses the splash once React has hydrated.
 *
 * Hydration is the honest "the site is usable now" signal: the HTML is
 * already painted by then, but nothing responds to a click until this runs.
 * That gap - downloading and executing the bundle - is the whole reason a
 * splash is worth showing, and it is why this is not on a timer.
 *
 * It flips a class on <html> rather than holding React state: the splash is
 * server-rendered markup that must exist before any of this loads, so it
 * cannot be owned by a component that only appears after hydration.
 */
export function SplashReady() {
  React.useEffect(() => {
    document.documentElement.classList.add("app-ready");
  }, []);

  return null;
}
