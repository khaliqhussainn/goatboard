import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyBoard() {
  return (
    <div className="billboard-surface-lg flex flex-col items-center gap-4 rounded-[2rem] py-20 text-center">
      <p className="text-2xl font-black tracking-tight">Nobody&apos;s the GOAT yet.</p>
      <p className="text-sm text-muted-foreground">Put something on the board.</p>
      <Link href="/create">
        <Button size="lg" variant="accent">
          Create Campaign
        </Button>
      </Link>
    </div>
  );
}
