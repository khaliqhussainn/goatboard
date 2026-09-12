"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePicker, fetchSiteLogo } from "@/components/campaign/image-picker";
import { adSlotSchema, isSafeUrl, AD_SLOT_PRICING, AD_SLOT_DURATIONS } from "@/lib/validation";
import { formatMoney, cn } from "@/lib/utils";
import type { AdSlotDuration } from "@/lib/types";

export function AdSlotForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [durationDays, setDurationDays] = React.useState<AdSlotDuration>(7);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageSource, setImageSource] = React.useState<"upload" | "site" | null>(null);
  const [backdropUrl, setBackdropUrl] = React.useState<string | null>(null);
  const [fetchingLogo, setFetchingLogo] = React.useState(false);
  const [logoNotFound, setLogoNotFound] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const lastAutoFetchedUrl = React.useRef<string | null>(null);

  // Pull the site's favicon as soon as there's a URL to work with, without
  // clobbering a logo the advertiser picked themselves.
  async function handleDestinationBlur() {
    const url = destinationUrl.trim();
    if (!url || !isSafeUrl(url)) return;
    if (imageSource === "upload" || lastAutoFetchedUrl.current === url) return;

    lastAutoFetchedUrl.current = url;
    setFetchingLogo(true);
    setLogoNotFound(false);
    const found = await fetchSiteLogo(url);
    if (found) {
      setImageUrl(found);
      setImageSource("site");
    } else {
      setLogoNotFound(true);
    }
    setFetchingLogo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = adSlotSchema.safeParse({
      name,
      description,
      destination_url: destinationUrl,
      image_url: imageUrl,
      backdrop_url: backdropUrl,
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
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
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
          onBlur={handleDestinationBlur}
          placeholder="https://yourthing.com"
        />
        {errors.destination_url && (
          <p className="text-xs text-red-500">{errors.destination_url}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-image">Logo</Label>
        <ImagePicker
          id="ad-image"
          value={imageUrl}
          name={name || "?"}
          caption={imageSource === "site" ? "Fetched from your website" : "Uploaded"}
          busy={fetchingLogo}
          busyLabel="Looking for your favicon…"
          emptyLabel="Upload a logo (optional)"
          onChange={(url) => {
            setImageUrl(url);
            setImageSource(url ? "upload" : null);
            if (!url) lastAutoFetchedUrl.current = null;
          }}
        />
        {logoNotFound && !imageUrl && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" /> Couldn&apos;t find a favicon on that site - upload one
            above.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ad-backdrop">Backdrop image (optional)</Label>
        <ImagePicker
          id="ad-backdrop"
          value={backdropUrl}
          wide
          caption="Shown faintly behind your ad"
          emptyLabel="Upload a background image"
          onChange={setBackdropUrl}
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

      <Button type="submit" size="lg" variant="abstract" disabled={submitting}>
        {submitting ? "Redirecting…" : `Rent for ${formatMoney(AD_SLOT_PRICING[durationDays])}`}
      </Button>
    </form>
  );
}
