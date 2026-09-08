import type { SVGProps } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getSiteUrl, cn } from "@/lib/utils";

function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareXButton({
  slug,
  name,
  rank,
  totalPower,
  size = "sm",
  variant = "outline",
  compact = false,
  className,
}: {
  slug: string;
  name: string;
  rank: number;
  totalPower: number;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Hide the "Share" label below the sm breakpoint, keeping just the icon. */
  compact?: boolean;
  className?: string;
}) {
  const url = `${getSiteUrl()}/campaign/${slug}`;
  const text = `${name} is #${rank} on GOATBOARD with ${totalPower.toLocaleString(
    "en-US",
  )} Power. Vote to keep them on top:`;
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn(compact && "px-2 sm:px-3", className)}
    >
      <a
        href={intentUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${name} on X`}
        onClick={(e) => e.stopPropagation()}
      >
        <XLogo />
        <span className={compact ? "hidden sm:inline" : undefined}>Share</span>
      </a>
    </Button>
  );
}
