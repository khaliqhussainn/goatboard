"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReportButton({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, reason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Thanks — we'll take a look.");
      setOpen(false);
      setReason("");
    } catch {
      toast.error("Couldn't file report. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Flag className="size-3" /> Report
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this campaign</DialogTitle>
          <DialogDescription>
            Tell us what&apos;s wrong. We review every report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            required
            minLength={3}
            maxLength={500}
            placeholder="What's the issue?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Submit report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
