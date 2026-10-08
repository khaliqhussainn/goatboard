"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "@/components/campaign/image-picker";
import { adSlotSchema, AD_SLOT_PRICING } from "@/lib/validation";
import { formatMoney } from "@/lib/utils";

const AD_DURATION_DAYS = 7 as const;

export function AdSlotForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [backdropUrl, setBackdropUrl] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = adSlotSchema.safeParse({
      name,
      destination_url: destinationUrl,
      backdrop_url: backdropUrl,
      duration_days: AD_DURATION_DAYS,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const createRes = await fetch("/api/ad-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        toast.error(createData.message ?? "Couldn't save your ad.");
        setSubmitting(false);
        return;
      }

      const checkoutRes = await fetch("/api/ad-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adSlotId: createData.id }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        toast.error(checkoutData.message ?? "Couldn't start checkout.");
        setSubmitting(false);
        return;
      }

      onDone();
      window.location.href = checkoutData.url;
    } catch {
      toast.error("Couldn't start checkout. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-name">Site name</Label>
        <Input
          id="ad-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your site name"
          maxLength={60}
          required
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-url">Site URL</Label>
        <Input
          id="ad-url"
          type="url"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://yoursite.com"
          required
        />
        {errors.destination_url && (
          <p className="text-xs text-red-500">{errors.destination_url}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-backdrop">Backdrop image</Label>
        <ImagePicker
          id="ad-backdrop"
          value={backdropUrl}
          wide
          caption="Displayed at full strength across the entire banner"
          emptyLabel="Upload your banner backdrop"
          onChange={setBackdropUrl}
        />
        {errors.backdrop_url && (
          <p className="text-xs text-red-500">{errors.backdrop_url}</p>
        )}
      </div>

      <Button type="submit" size="lg" variant="abstract" disabled={submitting}>
        {submitting
          ? "Redirecting…"
          : `Rent for ${formatMoney(AD_SLOT_PRICING[AD_DURATION_DAYS])}`}
      </Button>
    </form>
  );
}
