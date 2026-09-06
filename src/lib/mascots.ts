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
  // "/mascots/goat-1.png",
  // "/mascots/goat-2.png",
  // "/mascots/goat-3.png",
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
