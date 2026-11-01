"use client";

import * as React from "react";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/categories";
import type {
  Campaign,
  CampaignContact,
  CampaignPricingModel,
  Category,
} from "@/lib/types";
import { campaignSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CampaignContactDetails = Pick<CampaignContact, "email" | "maker_email">;

export function CampaignEditDialog({
  campaign,
  contact,
}: {
  campaign: Campaign;
  contact?: CampaignContactDetails;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [name, setName] = React.useState(campaign.name);
  const [description, setDescription] = React.useState(campaign.description);
  const [destinationUrl, setDestinationUrl] = React.useState(campaign.destination_url);
  const [email, setEmail] = React.useState(contact?.email ?? "");
  const [makerName, setMakerName] = React.useState(campaign.maker_name ?? "");
  const [makerEmail, setMakerEmail] = React.useState(contact?.maker_email ?? "");
  const [pricingModel, setPricingModel] = React.useState<CampaignPricingModel>(
    campaign.pricing_model,
  );
  const [xHandle, setXHandle] = React.useState(campaign.x_handle ?? "");
  const [category, setCategory] = React.useState<Category>(campaign.category);
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    campaign.image_urls?.length
      ? campaign.image_urls
      : campaign.image_url
        ? [campaign.image_url]
        : [],
  );

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const slotsLeft = 5 - imageUrls.length;
    if (files.length > slotsLeft) {
      toast.error(`You can add ${slotsLeft} more ${slotsLeft === 1 ? "image" : "images"}.`);
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok || !data.url) {
          throw new Error(data.message ?? "Couldn't upload an image.");
        }
        uploaded.push(data.url);
      }
      setImageUrls((current) => [...current, ...uploaded].slice(0, 5));
      setErrors((current) => ({ ...current, image_urls: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload images.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = campaignSchema.safeParse({
      name,
      description,
      destination_url: destinationUrl,
      image_urls: imageUrls,
      email,
      maker_name: makerName,
      maker_email: makerEmail,
      pricing_model: pricingModel,
      x_handle: xHandle,
      category,
      first_comment: null,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          description: parsed.data.description,
          destination_url: parsed.data.destination_url,
          image_urls: parsed.data.image_urls,
          email: parsed.data.email,
          maker_name: parsed.data.maker_name,
          maker_email: parsed.data.maker_email,
          pricing_model: parsed.data.pricing_model,
          x_handle: parsed.data.x_handle,
          category: parsed.data.category,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Couldn't update the listing.");

      toast.success("Listing details updated.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>
            Changes appear on the public listing immediately. Rankings, votes, and the public URL
            stay unchanged.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="grid gap-5 pt-2">
          <Field label="Listing name" error={errors.name}>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
          </Field>

          <Field label="Short description" error={errors.description}>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={280}
              rows={3}
            />
          </Field>

          <Field label="Destination URL" error={errors.destination_url}>
            <Input
              type="url"
              value={destinationUrl}
              onChange={(event) => setDestinationUrl(event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign email" error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
              />
            </Field>
            <Field label="Maker email" error={errors.maker_email}>
              <Input
                type="email"
                value={makerEmail}
                onChange={(event) => setMakerEmail(event.target.value)}
                maxLength={254}
              />
            </Field>
            <Field label="Maker name" error={errors.maker_name}>
              <Input
                value={makerName}
                onChange={(event) => setMakerName(event.target.value)}
                maxLength={80}
              />
            </Field>
            <Field label="X account" error={errors.x_handle}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  value={xHandle}
                  onChange={(event) => setXHandle(event.target.value)}
                  maxLength={15}
                  className="pl-7"
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pricing" error={errors.pricing_model}>
              <Select
                value={pricingModel}
                onValueChange={(value) => setPricingModel(value as CampaignPricingModel)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category" error={errors.category}>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={`Product images (${imageUrls.length}/5)`} error={errors.image_urls}>
            {imageUrls.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product image ${index + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/75 p-1.5 text-white"
                      aria-label={`Remove product image ${index + 1}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    {index === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">Primary</span>}
                  </div>
                ))}
              </div>
            )}
            {imageUrls.length < 5 && (
              <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                {uploading ? "Uploading" : "Add product images"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  onChange={uploadImages}
                  disabled={uploading}
                />
              </label>
            )}
          </Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Saving" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
