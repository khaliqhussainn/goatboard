import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <div className="sticky top-0 z-40 px-4 pt-[15px] sm:px-6">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl bg-white px-4 text-black shadow-[0_10px_30px_-14px_rgba(0,0,0,0.3)] sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-gb.png" alt="GOATBOARD" className="h-10 w-auto" />
          </Link>
          <div className="hidden items-center gap-5 text-sm font-medium sm:flex">
            <Link href="/explore" className="text-black/60 transition-colors hover:text-black">
              Explore
            </Link>
            <Link href="/mine" className="text-black/60 transition-colors hover:text-black">
              My Campaigns
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button size="sm">Create Campaign</Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
