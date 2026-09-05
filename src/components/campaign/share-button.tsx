"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text: string;
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
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 /> Share
    </Button>
  );
}
