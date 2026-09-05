"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, loading, openAuthModal, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            GOATBOARD
          </Link>
          <div className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/explore" className="transition-colors hover:text-foreground">
              Explore
            </Link>
            <Link href="/create" className="transition-colors hover:text-foreground">
              Create Campaign
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/create" className="sm:hidden">
            <Button size="sm" variant="outline">
              Create
            </Button>
          </Link>
          {!loading &&
            (user ? (
              <Button size="sm" variant="ghost" onClick={() => signOut()}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={openAuthModal}>
                Sign in
              </Button>
            ))}
          <Link href="/create" className="hidden sm:block">
            <Button size="sm" variant="accent">
              Create Campaign
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
