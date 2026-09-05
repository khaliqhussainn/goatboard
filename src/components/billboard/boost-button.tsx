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

export function BoostButton({
  campaignId,
  campaignName,
  size = "default",
  variant = "outline",
  className,
}: {
  campaignId: string;
  campaignName: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        aria-label="Boost this campaign"
      >
        <Zap /> Boost $
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
