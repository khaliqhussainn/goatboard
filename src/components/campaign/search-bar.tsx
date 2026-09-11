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
 * so refining a search doesn't spam browser history), and as a chromeless
 * inline field inside the header's expanding search (`size="minimal"`,
 * `navigation="push"` — see Navbar).
 */
export function SearchBar({
  defaultValue = "",
  category,
  navigation = "replace",
  size = "default",
  autoFocus = false,
  className,
}: {
  defaultValue?: string;
  category?: string;
  navigation?: "replace" | "push";
  size?: "default" | "minimal";
  autoFocus?: boolean;
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

  if (size === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search startups, categories, or @handles"
          aria-label="Search campaigns"
          autoFocus={autoFocus}
          className="w-full min-w-0 border-none bg-transparent text-sm text-black outline-none placeholder:text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search startups, categories, or @handles"
        aria-label="Search campaigns"
        autoFocus={autoFocus}
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
