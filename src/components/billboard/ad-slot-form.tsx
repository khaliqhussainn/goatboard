"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { adSlotSchema, AD_SLOT_PRICING, AD_SLOT_DURATIONS } from "@/lib/validation";
import { formatMoney, cn } from "@/lib/utils";
import type { AdSlotDuration } from "@/lib/types";

export function AdSlotForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [durationDays, setDurationDays] = React.useState<AdSlotDuration>(7);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't upload image. Try again.");
        return;
      }
      setImageUrl(data.url);
    } catch {
      toast.error("Couldn't upload image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = adSlotSchema.safeParse({
      name,
      description,
      destination_url: destinationUrl,
      image_url: imageUrl,
      duration_days: durationDays,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-name">Product name</Label>
        <Input
          id="ad-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What are people going to see?"
          maxLength={60}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-description">Short description</Label>
        <Textarea
          id="ad-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One short line. Make it count."
          maxLength={140}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-url">Destination URL</Label>
        <Input
          id="ad-url"
          type="url"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://yourthing.com"
        />
        {errors.destination_url && (
          <p className="text-xs text-red-500">{errors.destination_url}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-image">Logo (optional)</Label>
        {imageUrl ? (
          <div className="flex items-center gap-3">
            <CampaignAvatar src={imageUrl} name={name || "?"} className="size-12 shrink-0 rounded-xl" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              aria-label="Remove image"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="ad-image"
            className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                <span className="text-xs">Upload a logo (optional)</span>
              </>
            )}
          </label>
        )}
        <input
          id="ad-image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={handleImageChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Duration</Label>
        <div className="grid grid-cols-3 gap-2">
          {AD_SLOT_DURATIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDurationDays(days)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors",
                durationDays === days
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-hero-pink hover:text-hero-pink",
              )}
            >
              <span>{days} days</span>
              <span className="text-xs font-normal opacity-70">
                {formatMoney(AD_SLOT_PRICING[days])}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" variant="abstract" disabled={submitting || uploading}>
        {submitting ? "Redirecting…" : `Rent for ${formatMoney(AD_SLOT_PRICING[durationDays])}`}
      </Button>
    </form>
  );
}
