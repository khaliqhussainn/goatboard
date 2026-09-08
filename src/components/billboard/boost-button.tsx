"use client";

import * as React from "react";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { BoostSelector } from "@/components/billboard/boost-selector";
import { cn } from "@/lib/utils";

export function BoostButton({
  campaignId,
  campaignName,
  size = "default",
  variant = "outline",
  compact = false,
  className,
}: {
  campaignId: string;
  campaignName: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Hide the "Boost $" label below the sm breakpoint, keeping just the icon. */
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size={size}
        variant={variant}
        className={cn(compact && "px-2 sm:px-3", className)}
        onClick={() => setOpen(true)}
        aria-label="Boost this campaign"
      >
        <Zap /> <span className={compact ? "hidden sm:inline" : undefined}>Boost $</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boost</DialogTitle>
        </DialogHeader>
        <BoostSelector campaignId={campaignId} campaignName={campaignName} />
      </DialogContent>
    </Dialog>
  );
}
