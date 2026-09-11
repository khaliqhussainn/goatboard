import { Button, type ButtonProps } from "@/components/ui/button";
import { XLogo } from "@/components/icons/x-logo";
import { getSiteUrl, cn } from "@/lib/utils";

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
