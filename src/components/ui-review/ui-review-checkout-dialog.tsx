"use client";

import { ArrowRight, AtSign, Link2, Loader2, MousePointer2, NotebookPen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import type { UiReviewPlanKey } from "@/lib/ui-review";
import { uiReviewCheckoutSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function UiReviewCheckoutDialog({
  planKey,
  planName,
  priceUsd,
  triggerClassName,
  triggerLabel = "Get Started",
}: {
  planKey: UiReviewPlanKey;
  planName: string;
  priceUsd: number;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [productUrl, setProductUrl] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = uiReviewCheckoutSchema.safeParse({
      plan_key: planKey,
      product_url: productUrl,
      review_notes: reviewNotes,
      x_handle: xHandle,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/ui-review/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json().catch(() => null)) as
        | { url?: string; message?: string }
        | null;

      if (!response.ok || !payload?.url) {
        toast.error(payload?.message ?? "Couldn't start checkout.");
        setSubmitting(false);
        return;
      }

      window.location.assign(payload.url);
    } catch {
      toast.error("Couldn't start checkout. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold transition-colors",
            triggerClassName ?? "bg-black text-white hover:opacity-85",
          )}
        >
          {triggerLabel} <ArrowRight className="size-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg overflow-hidden border-black/10 p-0">
        <div className="border-b border-black/5 bg-[#edf6ff] px-6 py-5 pr-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#cce6ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">
            <MousePointer2 className="size-3.5" /> UI Review
          </span>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-2xl font-black tracking-[-0.035em]">
              What should I review?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {planName} for ${priceUsd}. Share your product and what deserves the closest attention.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 pb-6">
          <div className="rounded-xl border border-[#b9dbfb] bg-[#f7fbff] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#25659d]">Selected review</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-sm font-black">{planName}</p>
              <p className="text-lg font-black">${priceUsd}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ui-review-product-url-${planKey}`} className="flex items-center gap-2">
              <Link2 className="size-4" /> Product link
            </Label>
            <Input
              id={`ui-review-product-url-${planKey}`}
              type="url"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="https://yourproduct.com"
              autoComplete="url"
              required
            />
            {errors.product_url && <p className="text-xs text-red-600">{errors.product_url}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ui-review-notes-${planKey}`} className="flex items-center gap-2">
              <NotebookPen className="size-4" /> Review focus or special notes
            </Label>
            <Textarea
              id={`ui-review-notes-${planKey}`}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="Tell me which screens, flows, or problems should get the most attention."
              maxLength={2000}
              rows={5}
              className="min-h-28"
            />
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span>Optional</span>
              <span>{reviewNotes.length}/2000</span>
            </div>
            {errors.review_notes && <p className="text-xs text-red-600">{errors.review_notes}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ui-review-x-handle-${planKey}`} className="flex items-center gap-2">
              <AtSign className="size-4" /> X handle
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                id={`ui-review-x-handle-${planKey}`}
                value={xHandle}
                onChange={(event) => setXHandle(event.target.value)}
                placeholder="yourhandle"
                autoComplete="off"
                maxLength={16}
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">I will use this to contact you about your review.</p>
            {errors.x_handle && <p className="text-xs text-red-600">{errors.x_handle}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-black text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Opening checkout..." : `Continue to checkout · $${priceUsd}`}
            {!submitting && <ArrowRight className="size-4" />}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
