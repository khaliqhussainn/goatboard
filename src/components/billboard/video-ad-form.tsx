"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VideoPicker } from "@/components/billboard/video-picker";
import { videoAdSchema, VIDEO_AD_PRICE_USD } from "@/lib/validation";
import { formatMoney, formatSlotDate, formatSlotRange } from "@/lib/utils";

type Availability = {
  nextStart: string;
  endsAt: string;
  queuedCount: number;
  liveUntil: string | null;
};

export function VideoAdForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [xHandle, setXHandle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [availability, setAvailability] = React.useState<Availability | null>(null);

  // The queue as it stands right now, so the buyer sees the window they're
  // actually buying rather than just "7 days".
  React.useEffect(() => {
    let active = true;
    fetch("/api/video-ads/availability")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setAvailability(data as Availability);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = videoAdSchema.safeParse({
      name,
      destination_url: destinationUrl,
      video_url: videoUrl,
      x_handle: xHandle,
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
      const createRes = await fetch("/api/video-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        toast.error(createData.message ?? "Couldn't save your video ad.");
        setSubmitting(false);
        return;
      }

      const checkoutRes = await fetch("/api/video-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoAdId: createData.id }),
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
        <Label htmlFor="video-ad-name">Product name</Label>
        <Input
          id="video-ad-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What are people going to see?"
          maxLength={60}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-ad-url">Destination URL</Label>
        <Input
          id="video-ad-url"
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
        <Label htmlFor="video-ad-x">X account</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="video-ad-x"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="yourhandle"
            maxLength={15}
            className="pl-7"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Required - it is how we reach you about this spot.
        </p>
        {errors.x_handle && <p className="text-xs text-red-500">{errors.x_handle}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-ad-video">Video</Label>
        <VideoPicker id="video-ad-video" value={videoUrl} onChange={setVideoUrl} />
        {errors.video_url && <p className="text-xs text-red-500">{errors.video_url}</p>}
      </div>

      {availability && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm text-muted-foreground">Your 7-day spot runs</span>
            <span className="text-sm font-semibold">
              {formatSlotRange(availability.nextStart, availability.endsAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {availability.queuedCount === 0
              ? "The spot is free - your video goes live as soon as payment clears."
              : availability.queuedCount === 1
                ? `1 video is booked ahead of you, running until ${formatSlotDate(availability.nextStart)}.`
                : `${availability.queuedCount} videos are booked ahead of you, through ${formatSlotDate(availability.nextStart)}.`}{" "}
            Your dates are locked in once payment completes.
          </p>
        </div>
      )}

      <Button type="submit" size="lg" variant="abstract" disabled={submitting}>
        {submitting ? "Redirecting…" : `Rent for ${formatMoney(VIDEO_AD_PRICE_USD)}`}
      </Button>
    </form>
  );
}
