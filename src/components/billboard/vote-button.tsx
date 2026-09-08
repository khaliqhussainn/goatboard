"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoteButton({
  campaignId,
  onVoted,
  size = "default",
  compact = false,
  className,
}: {
  campaignId: string;
  onVoted?: (totalPower: number) => void;
  size?: ButtonProps["size"];
  /** Hide the "Vote" label below the sm breakpoint, keeping just the icon. */
  compact?: boolean;
  className?: string;
}) {
  const [pending, setPending] = React.useState(false);
  const [showBump, setShowBump] = React.useState(false);

  async function handleVote() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.message === "already_voted") {
          toast("You already voted today.", {
            description: "Come back tomorrow to vote again.",
          });
        } else {
          if (data.detail) console.error("vote failed:", data.detail);
          toast.error("Couldn't cast your vote. Try again.");
        }
        return;
      }

      setShowBump(true);
      setTimeout(() => setShowBump(false), 900);
      onVoted?.(data.totalPower);
    } catch {
      toast.error("Couldn't cast your vote. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <Button
        size={size}
        onClick={handleVote}
        disabled={pending}
        className={cn(compact && "px-2 sm:px-3", className)}
        aria-label="Vote for this campaign"
      >
        <ArrowUp /> <span className={compact ? "hidden sm:inline" : undefined}>Vote</span>
      </Button>
      <AnimatePresence>
        {showBump && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -22, scale: 1 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
              "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-green px-2 py-0.5 text-xs font-bold text-black",
            )}
          >
            +1 Power
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
