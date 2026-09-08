import { Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DownloadTileButton({
  slug,
  size = "default",
  variant = "outline",
  compact = false,
  className,
}: {
  slug: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Hide the "Download" label below the sm breakpoint, keeping just the icon. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn(compact && "px-2 sm:px-3", className)}
    >
      <a
        href={`/campaign/${slug}/opengraph-image`}
        download={`${slug}-goatboard.png`}
        aria-label="Download this tile as an image"
        onClick={(e) => e.stopPropagation()}
      >
        <Download />
        <span className={compact ? "hidden sm:inline" : undefined}>Download</span>
      </a>
    </Button>
  );
}
