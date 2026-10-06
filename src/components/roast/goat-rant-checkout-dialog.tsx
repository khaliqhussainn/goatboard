"use client";

import { ArrowRight, AtSign, Flame, Link2, Loader2, NotebookPen } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
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
import { goatRantCheckoutSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type RantContext = {
  id: string;
  body: string;
};

type GoatRantCheckoutDialogProps = {
  rant?: RantContext | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  triggerClassName?: string;
};

export function GoatRantCheckoutDialog({
  rant = null,
  open,
  onOpenChange,
  trigger,
  triggerClassName,
}: GoatRantCheckoutDialogProps) {
  const [productUrl, setProductUrl] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = goatRantCheckoutSchema.safeParse({
      product_url: productUrl,
      video_notes: videoNotes,
      x_handle: xHandle,
      rant_id: rant?.id ?? null,
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
      const response = await fetch("/api/goat-rant/checkout", {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-sm font-black text-white hover:opacity-85",
                triggerClassName,
              )}
            >
              Get your audience roasted <ArrowRight className="size-4" />
            </button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg overflow-hidden border-black/10 p-0">
        <div className="border-b border-black/5 bg-[#fff0ee] px-6 py-5 pr-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#ffd0cb] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">
            <Flame className="size-3.5 fill-[#ff5b4d] text-[#ff5b4d]" /> GOAT Rant
          </span>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-2xl font-black tracking-[-0.035em]">
              Tell me what to roast.
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Share the product and what the video should focus on. You will review payment on Lemon Squeezy next.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 pb-6">
          {rant && (
            <div className="rounded-xl border border-[#ff8b81]/30 bg-[#fff8f7] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d73a2c]">
                Selected audience problem
              </p>
              <p className="mt-1 line-clamp-3 text-sm font-semibold">“{rant.body}”</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="goat-rant-product-url" className="flex items-center gap-2">
              <Link2 className="size-4" /> Product link
            </Label>
            <Input
              id="goat-rant-product-url"
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
            <Label htmlFor="goat-rant-video-notes" className="flex items-center gap-2">
              <NotebookPen className="size-4" /> Video requirements or special notes
            </Label>
            <Textarea
              id="goat-rant-video-notes"
              value={videoNotes}
              onChange={(event) => setVideoNotes(event.target.value)}
              placeholder="Tell me which feature, problem, or audience should get the most attention."
              maxLength={2000}
              rows={5}
              className="min-h-28"
            />
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span>Optional</span>
              <span>{videoNotes.length}/2000</span>
            </div>
            {errors.video_notes && <p className="text-xs text-red-600">{errors.video_notes}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goat-rant-x-handle" className="flex items-center gap-2">
              <AtSign className="size-4" /> X handle
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                id="goat-rant-x-handle"
                value={xHandle}
                onChange={(event) => setXHandle(event.target.value)}
                placeholder="yourhandle"
                autoComplete="off"
                maxLength={16}
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">I will use this to contact you about the video.</p>
            {errors.x_handle && <p className="text-xs text-red-600">{errors.x_handle}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-black text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Opening checkout..." : "Continue to Lemon Squeezy checkout"}
            {!submitting && <ArrowRight className="size-4" />}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
