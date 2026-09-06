/**
 * Decorative, fixed, full-viewport backdrop — the colorful "wallpaper" the
 * billboard floats on top of. Renders the real uploaded backdrop image
 * (public/backdrop.png), covering the whole viewport and cropping to fill
 * rather than letterboxing. Purely presentational (aria-hidden, no
 * interaction, no text ever sits on it directly).
 */
export function AbstractBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-blob-navy bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/backdrop.png)" }}
    />
  );
}
