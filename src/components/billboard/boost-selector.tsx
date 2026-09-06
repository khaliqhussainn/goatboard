"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { POWER_PER_DOLLAR } from "@/lib/validation";

export function BoostSelector({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const [amount, setAmount] = React.useState<number>(5);
  const [custom, setCustom] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const power = amount * POWER_PER_DOLLAR;

  function handleCustomChange(value: string) {
    setCustom(value);
    const parsed = Math.floor(Number(value));
    if (Number.isFinite(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  }

  async function handleBoost() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.message ?? "Couldn't start checkout. Try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Couldn't start checkout. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Boosting <span className="font-semibold text-foreground">{campaignName}</span>. $1 = 3
        Power, permanently.
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Custom</span>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min={1}
            max={5000}
            placeholder="Amount"
            value={custom}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="pl-6"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <span className="text-sm font-medium">{formatMoney(amount)}</span>
        <span className="text-sm font-bold">→ +{power.toLocaleString("en-US")} Power</span>
      </div>

      <Button size="lg" variant="abstract" onClick={handleBoost} disabled={loading || amount < 1}>
        {loading ? "Redirecting…" : `Boost for ${formatMoney(amount)}`}
      </Button>
    </div>
  );
}
