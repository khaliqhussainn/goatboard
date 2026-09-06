import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/billboard/animated-number";

const sizes = {
  xl: "text-6xl sm:text-7xl",
  lg: "text-3xl sm:text-4xl",
  md: "text-xl",
  sm: "text-base",
};

export function PowerDisplay({
  power,
  size = "md",
  className,
}: {
  power: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <AnimatedNumber
        value={power}
        className={cn("tabular-nums font-black tracking-tight", sizes[size])}
      />
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold text-muted-foreground",
          size === "xl" ? "text-lg" : size === "lg" ? "text-sm" : "text-[11px] uppercase",
        )}
      >
        <Zap className={cn("fill-current", size === "xl" || size === "lg" ? "size-4" : "size-3")} />
        Power
      </span>
    </div>
  );
}
