/**
 * Decorative GOATBOARD mascot art — a small illustrated sticker shown in the
 * corner of the #1 spotlight and the #2/#3 tiles, purely for brand flavor.
 * It's never the campaign's own image (that's the big logo area); this is
 * just "the goat" showing up as a mascot.
 *
 * To activate: drop image files into /public/mascots/ and list them here.
 * Multiple entries let it rotate (deterministically, per campaign) instead
 * of showing the exact same pose on every card.
 */
export const MASCOT_IMAGES: string[] = [
  "/mascots/goat-1.webp",
  "/mascots/goat-2.webp",
  "/mascots/goat-3.webp",
  "/mascots/goat-4.webp",
  "/mascots/goat-5.webp",
  "/mascots/goat-6.webp",
];

/** Deterministic pick so the same campaign always gets the same mascot pose. */
export function pickMascot(seed: string): string | null {
  if (MASCOT_IMAGES.length === 0) return null;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return MASCOT_IMAGES[Math.abs(hash) % MASCOT_IMAGES.length];
}

/**
 * The ad slot's own mascot — cycles to the next pose once per UTC hour
 * rather than being tied to a campaign/seed. Computed server-side (the
 * homepage is fully dynamic, revalidate = 0) and passed down as a prop
 * rather than called from a client component, so the pick doesn't depend on
 * exactly when a client happens to render relative to the hour boundary.
 */
export function pickHourlyMascot(): string | null {
  if (MASCOT_IMAGES.length === 0) return null;
  const hourIndex = Math.floor(Date.now() / (60 * 60 * 1000));
  return MASCOT_IMAGES[hourIndex % MASCOT_IMAGES.length];
}
