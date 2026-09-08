"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ShareButton({
  url,
  title,
  text,
  size = "sm",
  compact = false,
  className,
}: {
  url: string;
  title: string;
  text: string;
  size?: ButtonProps["size"];
  /** Hide the "Share" label below the sm breakpoint, keeping just the icon. */
  compact?: boolean;
  className?: string;
}) {
  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled — ignore
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied.");
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleShare}
      className={cn(compact && "px-2 sm:px-3", className)}
      aria-label="Share this campaign"
    >
      <Share2 /> <span className={compact ? "hidden sm:inline" : undefined}>Share</span>
    </Button>
  );
}
