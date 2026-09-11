"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { campaignSchema, isSafeUrl } from "@/lib/validation";
import { CampaignPreview } from "@/components/campaign/campaign-preview";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { CATEGORIES } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types";

export function CampaignCreationForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [xHandle, setXHandle] = React.useState("");
  const [category, setCategory] = React.useState<Category>("product");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageSource, setImageSource] = React.useState<"upload" | "site" | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [fetchingLogo, setFetchingLogo] = React.useState(false);
  const [logoNotFound, setLogoNotFound] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const lastAutoFetchedUrl = React.useRef<string | null>(null);

  async function handleDestinationBlur() {
    const url = destinationUrl.trim();
    if (!url || !isSafeUrl(url)) return;
    // Don't clobber an image the visitor already chose, and don't re-fetch
    // the same URL twice in a row.
    if (imageSource === "upload" || lastAutoFetchedUrl.current === url) return;

    lastAutoFetchedUrl.current = url;
    setFetchingLogo(true);
    setLogoNotFound(false);
    try {
      const res = await fetch("/api/fetch-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
        setImageSource("site");
      } else {
        setLogoNotFound(true);
      }
    } catch {
      setLogoNotFound(true);
    } finally {
      setFetchingLogo(false);
    }
  }

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
      setImageSource("upload");
    } catch {
      toast.error("Couldn't upload image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImageUrl(null);
    setImageSource(null);
    lastAutoFetchedUrl.current = null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = campaignSchema.safeParse({
      name,
      description,
      destination_url: destinationUrl,
      image_url: imageUrl,
      x_handle: xHandle,
      category,
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
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Couldn't publish your campaign.");
        setSubmitting(false);
        return;
      }

      toast.success("You're on the board.");
      router.push(`/campaign/${data.slug}`);
    } catch {
      toast.error("Couldn't publish your campaign. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Campaign name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are people going to see?"
            maxLength={60}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two sentences. Make it count."
            maxLength={280}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">Destination URL</Label>
          <Input
            id="url"
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
          <Label htmlFor="x-handle">X account (optional)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="x-handle"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="yourhandle"
              maxLength={15}
              className="pl-7"
            />
          </div>
          {errors.x_handle && <p className="text-xs text-red-500">{errors.x_handle}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image">Image / logo</Label>

          {imageUrl ? (
            <div className="flex items-center gap-3">
              <CampaignAvatar src={imageUrl} name={name || "?"} className="size-14 shrink-0" />
              <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                {imageSource === "site" ? "Fetched from your website" : "Uploaded"}
              </div>
              <label
                htmlFor="image"
                className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={clearImage}
                aria-label="Remove image"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {uploading || fetchingLogo ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {fetchingLogo && (
                    <span className="text-xs">Looking for a logo on your site…</span>
                  )}
                </>
              ) : (
                <>
                  <ImagePlus className="size-5" />
                  <span className="text-xs">Upload an image (optional)</span>
                </>
              )}
            </label>
          )}

          {logoNotFound && !imageUrl && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3" /> Couldn&apos;t find a logo on that site - upload one
              above.
            </p>
          )}

          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleImageChange}
          />
        </div>

        <Button type="submit" size="lg" variant="abstract" disabled={submitting || uploading}>
          {submitting ? "Publishing…" : "Publish campaign"}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Preview
        </p>
        <CampaignPreview
          name={name}
          description={description}
          imageUrl={imageUrl}
          category={category}
          xHandle={xHandle}
        />
      </div>
    </div>
  );
}
