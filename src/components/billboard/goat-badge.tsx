export function GoatBadge({
  size = "s",
  className,
}: {
  size?: "sm" | "xs";
  className?: string;
}) {
  return (
    <span
      title="Once reached #1 on GOATBOARD"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pregoat.png"
        alt="Once reached #1"
        className={size === "sm" ? "h-7 w-auto" : "h-6 w-auto"}
      />
    </span>
  );
}
