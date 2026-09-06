/**
 * Decorative, fixed, full-viewport backdrop of bold flat abstract shapes —
 * the colorful "wallpaper" the billboard floats on top of. Navy fills the
 * whole container so no background ever shows through the gaps between
 * shapes; large circles are layered on top to match the reference image's
 * color-block composition. Purely presentational (aria-hidden, no
 * interaction, no text ever sits on it directly), so it's static markup
 * with no JS cost.
 */
export function AbstractBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-blob-navy">
      <div className="absolute -right-[15%] -top-[25%] size-[75vmax] rounded-full bg-blob-yellow" />
      <div className="absolute -right-[30%] top-[18%] size-[70vmax] rounded-full bg-blob-orange" />
      <div className="absolute -bottom-[35%] -left-[20%] size-[80vmax] rounded-full bg-blob-teal" />
      <div className="absolute -bottom-[30%] right-[2%] size-[65vmax] rounded-full bg-blob-purple" />
    </div>
  );
}
