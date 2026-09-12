"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { cn } from "@/lib/utils";

/**
 * Asks the server to pull an icon off a site — apple-touch-icon, any declared
 * <link rel="icon">, an og:image, or /favicon.ico as a last resort — and
 * returns the uploaded copy's URL, or null if nothing usable was found.
 */
export async function fetchSiteLogo(url: string): Promise<string | null> {
  try {
    const res = await fetch("/api/fetch-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    return res.ok && data.url ? (data.url as string) : null;
  } catch {
    return null;
  }
}

/**
 * Upload/preview/clear control shared by the public ad form and the admin
 * one, so "fetch the favicon, or upload your own" behaves identically in
 * both instead of the admin panel only taking a pasted URL.
 */
export function ImagePicker({
  id,
  value,
  onChange,
  name = "?",
  caption,
  busy = false,
  busyLabel,
  emptyLabel = "Upload an image",
  wide = false,
}: {
  id: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Seeds the fallback avatar's initial/colour when there's no image. */
  name?: string;
  /** Where the current image came from, e.g. "Fetched from your website". */
  caption?: string;
  /** True while the parent is off fetching a logo, so the box shows a spinner. */
  busy?: boolean;
  busyLabel?: string;
  emptyLabel?: string;
  /** Preview a full-bleed backdrop as a wide strip rather than a square. */
  wide?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
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
      onChange(data.url as string);
    } catch {
      toast.error("Couldn't upload image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {value ? (
        <div className="flex items-center gap-3">
          {wide ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-12 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <CampaignAvatar src={value} name={name} className="size-12 shrink-0 rounded-xl" />
          )}
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">{caption}</div>
          <label
            htmlFor={id}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Replace
          </label>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            wide ? "h-16" : "h-20",
          )}
        >
          {uploading || busy ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {busy && busyLabel && <span className="text-xs">{busyLabel}</span>}
            </>
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-xs">{emptyLabel}</span>
            </>
          )}
        </label>
      )}

      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={handleFile}
      />
    </>
  );
}
