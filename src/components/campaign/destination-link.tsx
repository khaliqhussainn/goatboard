"use client";

import { ExternalLink } from "lucide-react";
import { trackClick } from "@/lib/track-click";
import { hostnameOf, cn } from "@/lib/utils";

/**
 * The outbound link to a campaign's own site. Fires a fire-and-forget click
 * ping (see lib/track-click.ts) without affecting navigation — the browser
 * opens the new tab exactly as it would with a plain anchor.
 */
export function DestinationLink({
  campaignId,
  url,
  className,
}: {
  campaignId: string;
  url: string;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => trackClick(campaignId)}
      className={cn(
        "inline-flex w-fit items-center gap-1 font-semibold text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {hostnameOf(url)}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
