"use client";

import * as React from "react";
import { toast } from "sonner";
import { Film, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE = 25 * 1024 * 1024;

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

    if (file.size > MAX_SIZE) {
      toast.error("Video must be under 25MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/video", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't upload video. Try again.");
        return;
      }
      onChange(data.url as string);
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
