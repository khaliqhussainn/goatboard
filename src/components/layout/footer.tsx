"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <footer
      className={cn(
        "py-6 text-center text-xs",
        isAdmin ? "text-muted-foreground" : "text-white",
      )}
    >
      GOATBOARD - there is one spot everyone wants.
    </footer>
  );
}
