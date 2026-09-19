"use client";

import * as React from "react";
import { toast } from "sonner";
import { Film, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AD_VIDEO_BUCKET, MAX_VIDEO_BYTES } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * Upload/preview/clear control for the video ad's clip, the same shape as
 * ImagePicker (see components/campaign/image-picker.tsx) but for video:
 * no "fetch from site" option (nothing to fetch a video from), and the
 * preview is the video itself, muted and looping, rather than a static
 * thumbnail.
 */
export function VideoPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be under 25MB.");
      return;
    }

    setUploading(true);
    try {
      // The server only signs the upload; the bytes go straight from here to
      // Supabase Storage, which is the only way a file this size gets there
      // at all (see the route for why).
      const res = await fetch("/api/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast.error(data?.message ?? "Couldn't start the upload. Try again.");
        return;
      }

      const { error } = await createClient()
        .storage.from(AD_VIDEO_BUCKET)
        .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });

      if (error) {
        // Surfaced rather than swallowed: at this point the failure is
        // Supabase's own (size limit, mime type, expired token), and its
        // message is the only thing that says which.
        toast.error(error.message || "Couldn't upload video. Try again.");
        return;
      }
      onChange(data.publicUrl as string);
    } catch {
      toast.error("Couldn't upload video. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {value ? (
        <div className="flex items-center gap-3">
          <video
            src={value}
            muted
            loop
            autoPlay
            playsInline
            className="h-16 w-28 shrink-0 rounded-lg bg-black object-cover"
          />
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">Uploaded</div>
          <label
            htmlFor={id}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Replace
          </label>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove video"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Film className="size-5" />
              <span className="text-xs">Upload a video (MP4/WebM, under 25MB)</span>
            </>
          )}
        </label>
      )}

      <input
        id={id}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        onChange={handleFile}
      />
    </>
  );
}
