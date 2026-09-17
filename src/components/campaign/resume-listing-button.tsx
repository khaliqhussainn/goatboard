"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LISTING_PRICE_USD } from "@/lib/listing";

/**
 * Sends someone back to the checkout for a campaign they created but never
 * paid for. Without it an abandoned payment leaves a campaign that nobody -
 * including its owner - can see or finish.
 */
export function ResumeListingButton({ campaignId }: { campaignId: string }) {
  const [busy, setBusy] = React.useState(false);

  async function resume() {
    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.message ?? "Couldn't start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Couldn't start checkout. Try again.");
      setBusy(false);
    }
  }

  return (
    <Button size="sm" onClick={resume} disabled={busy} className="shrink-0">
      {busy ? <Loader2 className="animate-spin" /> : null}
      {busy ? "Opening…" : `Pay $${LISTING_PRICE_USD} to publish`}
    </Button>
  );
}
