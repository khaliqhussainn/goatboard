GOATBOARD mascot art (goat-1.webp … goat-6.webp), listed in
src/lib/mascots.ts's MASCOT_IMAGES array. Shown as a small decorative
sticker in the corner of the #1 spotlight and #2/#3 tiles — picked
deterministically per campaign so it varies instead of repeating the same
pose everywhere.

To add more poses: drop the file here and append its path to
MASCOT_IMAGES. Prefer WebP with a transparent background, kept under
~350px on its longest side — these render at well under 100px on screen.
