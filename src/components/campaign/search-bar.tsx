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
 *
 * Used two ways: in place on /explore (`navigation="replace"`, the default,
 * so refining a search doesn't spam browser history), and as a "search from
 * anywhere" hero field on the homepage (`navigation="push"`, so Back returns
 * to `/` instead of landing back on Explore's own prior search).
 */
export function SearchBar({
  defaultValue = "",
  category,
  navigation = "replace",
  size = "default",
  className,
}: {
  defaultValue?: string;
  category?: string;
  navigation?: "replace" | "push";
  size?: "default" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    // Skip on mount — otherwise an idle search bar navigates itself to
    // /explore a moment after the page loads, before anyone's typed.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      const target = qs ? `/explore?${qs}` : "/explore";
      if (navigation === "push") {
        router.push(target, { scroll: false });
      } else {
        router.replace(target, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [value, category, navigation, router]);

  const isLg = size === "lg";

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          isLg ? "left-5 size-5" : "left-3.5 size-4",
        )}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search startups, categories, or @handles"
        aria-label="Search campaigns"
        className={cn(
          isLg &&
            "h-14 rounded-full pl-13 pr-12 text-base shadow-[0_20px_50px_-16px_rgba(0,0,0,0.35)] focus-visible:ring-hero-pink/40",
          !isLg && "pl-10 pr-9",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-hero-pink",
            isLg ? "right-4" : "right-3",
          )}
        >
          <X className={isLg ? "size-5" : "size-4"} />
        </button>
      )}
    </div>
  );
}
