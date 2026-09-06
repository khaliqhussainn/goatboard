import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            GOATBOARD
          </Link>
          <div className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/explore" className="transition-colors hover:text-foreground">
              Explore
            </Link>
            <Link href="/mine" className="transition-colors hover:text-foreground">
              My Campaigns
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button size="sm" variant="abstract">
              Create Campaign
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
