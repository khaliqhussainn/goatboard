/**
 * Decorative, fixed, full-viewport backdrop of bold flat abstract shapes —
 * the colorful "wallpaper" the billboard floats on top of. Purely
 * presentational (aria-hidden, no interaction, no text ever sits on it
 * directly), so it's static markup with no JS cost.
 */
export function AbstractBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute -left-[18%] -top-[22%] size-[60vmax] rounded-[58%_42%_35%_65%/60%_35%_65%_40%] bg-blob-navy" />
      <div className="absolute -right-[24%] -top-[18%] size-[55vmax] rounded-[40%_60%_65%_35%/45%_60%_40%_55%] bg-blob-orange" />
      <div className="absolute -bottom-[26%] -left-[20%] size-[58vmax] rounded-[45%_55%_60%_40%/55%_40%_60%_45%] bg-blob-teal" />
      <div className="absolute -bottom-[20%] -right-[18%] size-[52vmax] rounded-[60%_40%_45%_55%/40%_55%_45%_60%] bg-blob-coral" />
      <div className="absolute -top-[6%] left-[28%] size-[24vmax] rounded-[55%_45%_60%_40%/45%_60%_40%_55%] bg-blob-yellow" />
    </div>
  );
}
