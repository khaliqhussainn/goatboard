import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClickCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
      <MousePointerClick className="size-3" />
      {count.toLocaleString("en-US")} {count === 1 ? "click" : "clicks"}
    </span>
  );
}
