import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small floating icon button over a hero image's corner, mirroring RankChip. */
export function DownloadTileButton({ slug, className }: { slug: string; className?: string }) {
  return (
    <a
      href={`/campaign/${slug}/opengraph-image`}
      download={`${slug}-goatboard.png`}
      aria-label="Download this tile as an image"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-white/95 p-1.5 text-black shadow-md transition-opacity hover:opacity-85 active:opacity-75",
        className,
      )}
    >
      <Download className="size-4" />
    </a>
  );
}
