"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPicker } from "@/components/billboard/video-picker";
import { formatMoney } from "@/lib/utils";
import type { VideoAd } from "@/lib/types";

/** A paid row that hasn't finished yet - either playing now or waiting its
 *  turn. These are what an activation displaces. */
function isUnfinishedPaid(ad: VideoAd): boolean {
  return (
    ad.status === "paid" &&
    ad.lemon_squeezy_order_id !== null &&
    ad.ends_at !== null &&
    new Date(ad.ends_at).getTime() > Date.now()
  );
}

function statusInfo(ad: VideoAd): { label: string; variant: "green" | "blue" | "outline" } {
  const now = Date.now();
  const starts = ad.starts_at ? new Date(ad.starts_at).getTime() : null;
  const ends = ad.ends_at ? new Date(ad.ends_at).getTime() : null;

  if (ad.status === "pending") return { label: "Pending checkout", variant: "outline" };
  if (starts !== null && now < starts) return { label: "Scheduled", variant: "blue" };
  if (ends !== null && now < ends) return { label: "Live", variant: "green" };
  return { label: "Ended", variant: "outline" };
}

export function VideoAdAdminPanel({ videoAds }: { videoAds: VideoAd[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [xHandle, setXHandle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/video-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination_url: destinationUrl,
          video_url: videoUrl,
          x_handle: xHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't create video ad.");
        return;
      }
      toast.success("Video ad created for free — it's live now.");
      setName("");
      setDestinationUrl("");
      setXHandle("");
      setVideoUrl(null);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function activate(ad: VideoAd) {
    // The route reports what it displaced, but that is after the fact - the
    // warning has to come from the list we already have, before the call.
    const displaced = videoAds.filter((v) => v.id !== ad.id && isUnfinishedPaid(v));
    if (displaced.length > 0) {
      const names = displaced.map((v) => v.name).join(", ");
      const ok = window.confirm(
        `${displaced.length} paid video ${displaced.length === 1 ? "ad is" : "ads are"} still ` +
          `running or queued (${names}).\n\n` +
          `Activating "${ad.name}" stops whatever is playing and pushes the rest of the queue ` +
          `back by 7 days. Nobody loses their time, but their dates move. Continue?`,
      );
      if (!ok) return;
    }

    setActingId(ad.id);
    try {
      const res = await fetch(`/api/admin/video-ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't activate that video.");
        return;
      }
      toast.success(`"${ad.name}" is in the spot now, for 7 days.`);
      router.refresh();
    } finally {
      setActingId(null);
    }
  }

  async function endNow(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/video-ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      if (!res.ok) {
        toast.error("Couldn't end video ad.");
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
      const res = await fetch(`/api/admin/video-ads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete video ad.");
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
          <Label htmlFor="admin-video-name">Product name</Label>
          <Input
            id="admin-video-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-video-url">Destination URL</Label>
          <Input
            id="admin-video-url"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://…"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-video-x">X account</Label>
          <Input
            id="admin-video-x"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="yourhandle"
            maxLength={15}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="admin-video-video">Video</Label>
          <VideoPicker id="admin-video-video" value={videoUrl} onChange={setVideoUrl} />
        </div>
        <Button type="submit" disabled={creating} className="sm:col-span-2">
          {creating ? "Creating…" : "Create for free (test)"}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {videoAds.map((ad) => {
          const status = statusInfo(ad);
          const canEnd = status.label === "Live" || status.label === "Scheduled";
          // Everything but the one already playing: activating that would only
          // restart its 7 days, which isn't what the button reads as.
          const canActivate = status.label !== "Live";
          return (
            <div
              key={ad.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className="font-semibold">{ad.name}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">
                7d · {ad.lemon_squeezy_order_id ? formatMoney(ad.amount) : "free (admin)"}
              </span>
              {ad.x_handle && (
                <a
                  href={`https://x.com/${ad.x_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  @{ad.x_handle}
                </a>
              )}
              <div className="ml-auto flex shrink-0 gap-1.5">
                {canActivate && (
                  <Button
                    size="sm"
                    disabled={actingId === ad.id}
                    onClick={() => activate(ad)}
                  >
                    Activate now
                  </Button>
                )}
                {canEnd && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingId === ad.id}
                    onClick={() => endNow(ad.id)}
                  >
                    End now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === ad.id}
                  onClick={() => remove(ad.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
        {videoAds.length === 0 && <p className="text-sm text-muted-foreground">No video ads yet.</p>}
      </div>
    </div>
  );
}
