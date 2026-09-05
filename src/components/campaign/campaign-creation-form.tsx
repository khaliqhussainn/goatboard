"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { campaignSchema } from "@/lib/validation";
import { CampaignPreview } from "@/components/campaign/campaign-preview";
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
  const { user, openAuthModal } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [category, setCategory] = React.useState<Category>("product");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!user) {
      openAuthModal();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${nanoid()}.${ext}`;

    const { error } = await supabase.storage.from("campaign-images").upload(path, file);
    if (error) {
      toast.error("Couldn't upload image. Try again.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("campaign-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      openAuthModal();
      toast("Sign in to publish your campaign.");
      return;
    }

    const parsed = campaignSchema.safeParse({
      name,
      description,
      destination_url: destinationUrl,
      image_url: imageUrl,
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
            placeholder="https://yourthing.com"
          />
          {errors.destination_url && (
            <p className="text-xs text-red-500">{errors.destination_url}</p>
          )}
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
          <label
            htmlFor="image"
            className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                <span className="text-xs">
                  {imageUrl ? "Replace image" : "Upload an image (optional)"}
                </span>
              </>
            )}
          </label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleImageChange}
          />
        </div>

        <Button type="submit" size="lg" disabled={submitting || uploading}>
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
        />
      </div>
    </div>
  );
}
