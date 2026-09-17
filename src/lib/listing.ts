/**
 * What it costs to put a new campaign on the board, and the rule you have to
 * satisfy before you can.
 *
 * Kept out of lemonsqueezy.ts so client components can import the price and
 * the copy without dragging the server-only payment module into the browser
 * bundle.
 */

/** One dollar, one listing. The server is the only thing that sets this. */
export const LISTING_PRICE_USD = 1;

export const LISTING_CURRENCY = "USD";

/** Which env var holds the Lemon Squeezy variant a listing is sold as. */
export const LISTING_VARIANT_ENV_VAR = "LEMONSQUEEZY_LISTING_VARIANT_ID";

/**
 * How recently you must have voted to be allowed to start a listing.
 *
 * A rolling window rather than "today", so someone creating a campaign at
 * one minute past midnight is not told their vote from a minute ago doesn't
 * count. Long enough that a visitor who voted on the board and then wandered
 * over to /create isn't asked to do it twice - the requirement is a genuine
 * vote, not a hoop timed to the second.
 */
export const VOTE_GATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const VOTE_GATE_COPY = {
  heading: "Before you get on the board",
  body: "Give another startup some GOAT energy. One vote, then you're up.",
  locked: "Vote for a startup to continue",
  done: "Vote cast - you're good to go",
} as const;
