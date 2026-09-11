"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Debounces into a URL nav (`/explore?q=...`) rather than filtering
 * client-side, so results always come from the same server-side Supabase
 * query as the category pills (and stay in sync with them — see `category`).
 */
export function SearchBar({
  defaultValue = "",
  category,
  className,
}: {
  defaultValue?: string;
  category?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [value, category, router]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, category, or @handle"
        aria-label="Search campaigns"
        className="pl-10 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-hero-pink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
