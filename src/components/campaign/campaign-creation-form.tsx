"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { campaignSchema, isSafeUrl } from "@/lib/validation";
import { CampaignPreview } from "@/components/campaign/campaign-preview";
import { CATEGORIES } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GetListedPromoModal } from "@/components/get-listed/get-listed-promo-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LISTING_PRICE_USD } from "@/lib/listing";
import type { CampaignPricingModel, Category } from "@/lib/types";

export function CampaignCreationForm({
  onVoteRequired,
}: {
  /** Called when the server rejects the listing for want of a vote, so the
   *  flow can put the visitor back on that step instead of stranding them. */
  onVoteRequired?: () => void;
} = {}) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [makerName, setMakerName] = React.useState("");
  const [makerEmail, setMakerEmail] = React.useState("");
  const [pricingModel, setPricingModel] = React.useState<CampaignPricingModel | "">("");
  const [xHandle, setXHandle] = React.useState("");
  const [category, setCategory] = React.useState<Category>("product");
  const [firstComment, setFirstComment] = React.useState("");
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [fetchingLogo, setFetchingLogo] = React.useState(false);
  const [logoNotFound, setLogoNotFound] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const lastAutoFetchedUrl = React.useRef<string | null>(null);

  async function handleDestinationBlur() {
    const url = destinationUrl.trim();
    if (!url || !isSafeUrl(url)) return;
    // Don't clobber an image the visitor already chose, and don't re-fetch
    // the same URL twice in a row.
    if (imageUrls.length > 0 || lastAutoFetchedUrl.current === url) return;

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
        setImageUrls([data.url]);
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
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

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
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.message ?? "Couldn't upload an image.");
        }
        uploaded.push(data.url);
      }
      setImageUrls((current) => [...current, ...uploaded].slice(0, 5));
      setLogoNotFound(false);
      setErrors((current) => ({ ...current, image_urls: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload images. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearImage(index: number) {
    setImageUrls((current) => {
      const next = current.filter((_, imageIndex) => imageIndex !== index);
      if (next.length === 0) lastAutoFetchedUrl.current = null;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      first_comment: firstComment,
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
        // The vote gate is checked server-side too. If it says no, the step
        // is genuinely unmet - send them back rather than leaving them on a
        // form whose submit button will keep failing.
        if (data.code === "vote_required") onVoteRequired?.();
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        // Saved, but not on the board: the campaign is pending_payment until
        // the webhook confirms. Pause before leaving so the visitor can see
        // the Get Listed offer; dismissing it continues to this exact URL.
        setPendingCheckoutUrl(data.checkoutUrl);
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
    <>
      {pendingCheckoutUrl && (
        <GetListedPromoModal mode="post-submit" checkoutUrl={pendingCheckoutUrl} />
      )}
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
          <Label htmlFor="email">Campaign email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="hello@yourproduct.com"
            autoComplete="email"
            maxLength={254}
            required
          />
          <p className="text-xs text-muted-foreground">
            Kept private and used for campaign-related contact.
          </p>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maker-name">Maker name</Label>
            <Input
              id="maker-name"
              value={makerName}
              onChange={(event) => setMakerName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              maxLength={80}
              required
            />
            {errors.maker_name && <p className="text-xs text-red-500">{errors.maker_name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maker-email">Maker email</Label>
            <Input
              id="maker-email"
              type="email"
              value={makerEmail}
              onChange={(event) => setMakerEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
            {errors.maker_email && (
              <p className="text-xs text-red-500">{errors.maker_email}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pricing-model">Pricing</Label>
          <Select
            value={pricingModel}
            onValueChange={(value) => setPricingModel(value as CampaignPricingModel)}
          >
            <SelectTrigger id="pricing-model">
              <SelectValue placeholder="Choose a pricing model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {errors.pricing_model && (
            <p className="text-xs text-red-500">{errors.pricing_model}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="x-handle">X account</Label>
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
          <p className="text-xs text-muted-foreground">
            Required - it is how people reach you about your listing.
          </p>
          {errors.x_handle && <p className="text-xs text-red-500">{errors.x_handle}</p>}
        </div>

        {/* Posted as the campaign's opening comment the moment it publishes,
            so a new listing doesn't land with an empty thread under it. */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first-comment">First comment (optional)</Label>
          <Textarea
            id="first-comment"
            value={firstComment}
            onChange={(e) => setFirstComment(e.target.value.slice(0, 500))}
            placeholder="Kick off the thread - what should people know, try, or tell you?"
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Starts the comment thread on your campaign.
          </p>
          {errors.first_comment && (
            <p className="text-xs text-red-500">{errors.first_comment}</p>
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

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="image">Product images</Label>
            <span className="text-xs text-muted-foreground">{imageUrls.length}/5</span>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {imageUrls.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`Product image ${index + 1}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => clearImage(index)}
                    aria-label={`Remove product image ${index + 1}`}
                    className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-foreground shadow-sm transition-transform hover:scale-105"
                  >
                    <X className="size-3.5" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {imageUrls.length < 5 && (
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
                  <span className="text-xs">
                    {imageUrls.length === 0 ? "Add at least one image" : "Add more images"}
                  </span>
                </>
              )}
            </label>
          )}

          <p className="text-xs text-muted-foreground">
            One image is required. Add up to five PNG, JPG, WebP, or GIF files, 5MB each.
          </p>
          {errors.image_urls && <p className="text-xs text-red-500">{errors.image_urls}</p>}

          {logoNotFound && imageUrls.length === 0 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3" /> Couldn&apos;t find a logo on that site - upload one
              above.
            </p>
          )}

          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={handleImageChange}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Button type="submit" size="lg" variant="abstract" disabled={submitting || uploading}>
            {submitting ? "Opening checkout…" : `Continue to payment · $${LISTING_PRICE_USD}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            One-time ${LISTING_PRICE_USD} to put your campaign on the board. It goes live the
            moment the payment clears.
          </p>
        </div>
      </form>

      <div className="lg:sticky lg:top-24">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Preview
        </p>
        <CampaignPreview
          name={name}
          description={description}
          imageUrl={imageUrls[0] ?? null}
          category={category}
          xHandle={xHandle}
          makerName={makerName}
          pricingModel={pricingModel}
        />
      </div>
      </div>
    </>
  );
}
