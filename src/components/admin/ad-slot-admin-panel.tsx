"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePicker, fetchSiteLogo } from "@/components/campaign/image-picker";
import { AD_SLOT_PRICING, AD_SLOT_DURATIONS, isSafeUrl } from "@/lib/validation";
import { formatMoney, cn } from "@/lib/utils";
import type { AdSlot, AdSlotDuration } from "@/lib/types";

function statusInfo(slot: AdSlot): { label: string; variant: "green" | "blue" | "outline" } {
  const now = Date.now();
  const starts = slot.starts_at ? new Date(slot.starts_at).getTime() : null;
  const ends = slot.ends_at ? new Date(slot.ends_at).getTime() : null;

  if (slot.status === "pending") return { label: "Pending checkout", variant: "outline" };
  if (starts !== null && now < starts) return { label: "Scheduled", variant: "blue" };
  if (ends !== null && now < ends) return { label: "Live", variant: "green" };
  return { label: "Ended", variant: "outline" };
}

export function AdSlotAdminPanel({ adSlots }: { adSlots: AdSlot[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageSource, setImageSource] = React.useState<"upload" | "site" | null>(null);
  const [backdropUrl, setBackdropUrl] = React.useState<string | null>(null);
  const [fetchingLogo, setFetchingLogo] = React.useState(false);
  const lastAutoFetchedUrl = React.useRef<string | null>(null);
  const [durationDays, setDurationDays] = React.useState<AdSlotDuration>(7);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  async function handleDestinationBlur() {
    const url = destinationUrl.trim();
    if (!url || !isSafeUrl(url)) return;
    if (imageSource === "upload" || lastAutoFetchedUrl.current === url) return;

    lastAutoFetchedUrl.current = url;
    setFetchingLogo(true);
    const found = await fetchSiteLogo(url);
    if (found) {
      setImageUrl(found);
      setImageSource("site");
    }
    setFetchingLogo(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/ad-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          destination_url: destinationUrl,
          image_url: imageUrl || null,
          backdrop_url: backdropUrl || null,
          duration_days: durationDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't create ad slot.");
        return;
      }
      toast.success("Ad slot created for free — it's live now.");
      setName("");
      setDescription("");
      setDestinationUrl("");
      setImageUrl(null);
      setImageSource(null);
      setBackdropUrl(null);
      lastAutoFetchedUrl.current = null;
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function endNow(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/ad-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      if (!res.ok) {
        toast.error("Couldn't end ad slot.");
        return;
      }
      router.refresh();
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/ad-slots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete ad slot.");
        return;
      }
      router.refresh();
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-ad-name">Product name</Label>
          <Input
            id="admin-ad-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-ad-url">Destination URL</Label>
          <Input
            id="admin-ad-url"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            onBlur={handleDestinationBlur}
            placeholder="https://…"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="admin-ad-description">Description</Label>
          <Textarea
            id="admin-ad-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={140}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-ad-image">Logo</Label>
          <ImagePicker
            id="admin-ad-image"
            value={imageUrl}
            name={name || "?"}
            caption={imageSource === "site" ? "Fetched from the site" : "Uploaded"}
            busy={fetchingLogo}
            busyLabel="Looking for the favicon…"
            emptyLabel="Upload a logo"
            onChange={(url) => {
              setImageUrl(url);
              setImageSource(url ? "upload" : null);
              if (!url) lastAutoFetchedUrl.current = null;
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-ad-backdrop">Backdrop image (optional)</Label>
          <ImagePicker
            id="admin-ad-backdrop"
            value={backdropUrl}
            wide
            caption="Shown faintly behind the ad"
            emptyLabel="Upload a background image"
            onChange={setBackdropUrl}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Duration</Label>
          <div className="flex gap-1.5">
            {AD_SLOT_DURATIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDurationDays(days)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                  durationDays === days
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-hero-pink hover:text-hero-pink",
                )}
              >
                {days}d · {formatMoney(AD_SLOT_PRICING[days])}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={creating} className="sm:col-span-2">
          {creating ? "Creating…" : "Create for free (test)"}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {adSlots.map((slot) => {
          const status = statusInfo(slot);
          const canEnd = status.label === "Live" || status.label === "Scheduled";
          return (
            <div
              key={slot.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className="font-semibold">{slot.name}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">
                {slot.duration_days}d ·{" "}
                {slot.lemon_squeezy_order_id ? formatMoney(slot.amount) : "free (admin)"}
              </span>
              <div className="ml-auto flex shrink-0 gap-1.5">
                {canEnd && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingId === slot.id}
                    onClick={() => endNow(slot.id)}
                  >
                    End now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === slot.id}
                  onClick={() => remove(slot.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
        {adSlots.length === 0 && <p className="text-sm text-muted-foreground">No ad slots yet.</p>}
      </div>
    </div>
  );
}
