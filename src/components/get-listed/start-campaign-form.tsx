"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import {
  GET_LISTED_PACKAGE_LIST,
  GET_LISTED_PROMO,
  isGetListedPackageKey,
  getListedPackage,
  isPromoActive,
  promoPrice,
  type GetListedPackageKey,
} from "@/lib/get-listed";
import { getListedCampaignSchema } from "@/lib/validation";
import { formatMoney, cn } from "@/lib/utils";

type Step = "details" | "review";

/**
 * Choose package -> enter details -> review -> checkout.
 *
 * The schema validated here is the same one the API validates with, but the
 * server is the authority: this only saves the buyer a round trip. The price
 * shown at review is read from the shared package config and is never sent to
 * the server - the server looks it up again from the campaign it stored.
 */
export function StartCampaignForm({ initialPackage }: { initialPackage?: string }) {
  const [packageKey, setPackageKey] = React.useState<GetListedPackageKey>(
    isGetListedPackageKey(initialPackage) ? initialPackage : "big_goat",
  );
  const [step, setStep] = React.useState<Step>("details");
  const [startupName, setStartupName] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("startup");
  const [xUrl, setXUrl] = React.useState("");
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [otherUrl, setOtherUrl] = React.useState("");
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const pkg = getListedPackage(packageKey);
  // Display only. The server prices the order again at checkout, so a stale
  // tab can't buy at last week's price - or be charged this week's by mistake.
  const promo = isPromoActive();

  function buildPayload() {
    return {
      package_key: packageKey,
      startup_name: startupName,
      website_url: websiteUrl,
      description,
      category,
      x_url: xUrl || null,
      linkedin_url: linkedinUrl || null,
      other_url: otherUrl || null,
      accept_terms: acceptTerms,
    };
  }

  function goToReview(e: React.FormEvent) {
    e.preventDefault();
    // accept_terms is ticked on the review step, so it isn't checked yet here.
    const parsed = getListedCampaignSchema
      .omit({ accept_terms: true })
      .safeParse({ ...buildPayload(), accept_terms: undefined });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStep("review");
  }

  async function handleCheckout() {
    if (!acceptTerms) {
      toast.error("You need to accept the Terms of Service to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await fetch("/api/get-listed/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        toast.error(created.message ?? "Couldn't save your campaign.");
        setSubmitting(false);
        return;
      }

      const checkoutRes = await fetch("/api/get-listed/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: created.id }),
      });
      const checkout = await checkoutRes.json();
      if (!checkoutRes.ok || !checkout.url) {
        // The campaign is saved as a draft either way, so nothing is lost -
        // it shows up in My Campaigns and can be paid for from there.
        toast.error(checkout.message ?? "Couldn't start checkout.");
        setSubmitting(false);
        return;
      }

      window.location.href = checkout.url;
    } catch {
      toast.error("Couldn't start checkout. Try again.");
      setSubmitting(false);
    }
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-5">
        <div className="billboard-surface flex flex-col gap-3 rounded-[1.75rem] p-5">
          <h2 className="text-lg font-black tracking-tight">Review your order</h2>

          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Package" value={`${pkg.name} - ${pkg.summary}`} />
            <Row
              label="Price"
              value={
                promo
                  ? `${formatMoney(promoPrice(pkg))} one-time (was ${formatMoney(pkg.priceUsd)})`
                  : `${formatMoney(pkg.priceUsd)} one-time`
              }
            />
            <Row label="Startup" value={startupName} />
            <Row label="Website" value={websiteUrl} />
            <Row label="Category" value={category} />
            {xUrl && <Row label="X" value={xUrl} />}
            {linkedinUrl && <Row label="LinkedIn" value={linkedinUrl} />}
            {otherUrl && <Row label="Other link" value={otherUrl} />}
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Description
              </dt>
              <dd className="text-sm">{description}</dd>
            </div>
          </dl>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-border p-4">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 size-4 shrink-0"
          />
          <span className="text-sm text-muted-foreground">
            I accept the{" "}
            <Link href="/terms" target="_blank" className="font-semibold underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/refund-policy"
              target="_blank"
              className="font-semibold underline underline-offset-4"
            >
              Refund Policy
            </Link>
            . I understand directory acceptance is not guaranteed and that the submission count is
            the package&apos;s target, not a number of guaranteed live listings.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            variant="abstract"
            disabled={submitting || !acceptTerms}
            onClick={handleCheckout}
          >
            {submitting ? "Starting checkout…" : `Pay ${formatMoney(promoPrice(pkg))}`}
          </Button>
          <Button size="lg" variant="outline" disabled={submitting} onClick={() => setStep("details")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={goToReview} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Package</Label>
        {promo && (
          <p className="text-xs font-semibold text-yellow-900">
            {GET_LISTED_PROMO.percentOff}% off applied automatically at checkout.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {GET_LISTED_PACKAGE_LIST.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setPackageKey(option.key)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors",
                packageKey === option.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-hero-pink",
              )}
            >
              <span className="text-sm font-bold">{option.name}</span>
              <span className="text-xs opacity-70">{option.summary}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-sm font-black">{formatMoney(promoPrice(option))}</span>
                {promo && (
                  <span className="text-xs tabular-nums line-through opacity-60">
                    {formatMoney(option.priceUsd)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Field label="Startup name" error={errors.startup_name} htmlFor="startup_name">
        <Input
          id="startup_name"
          value={startupName}
          onChange={(e) => setStartupName(e.target.value)}
          maxLength={80}
        />
      </Field>

      <Field label="Website URL" error={errors.website_url} htmlFor="website_url">
        <Input
          id="website_url"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourstartup.com"
        />
      </Field>

      <Field label="Short description" error={errors.description} htmlFor="description">
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="What does it do, and who is it for?"
        />
      </Field>

      <Field label="Category" error={errors.category} htmlFor="category">
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="X / Twitter URL (optional)" error={errors.x_url} htmlFor="x_url">
        <Input
          id="x_url"
          type="url"
          value={xUrl}
          onChange={(e) => setXUrl(e.target.value)}
          placeholder="https://x.com/yourstartup"
        />
      </Field>

      <Field label="LinkedIn URL (optional)" error={errors.linkedin_url} htmlFor="linkedin_url">
        <Input
          id="linkedin_url"
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/company/…"
        />
      </Field>

      <Field label="Other relevant link (optional)" error={errors.other_url} htmlFor="other_url">
        <Input
          id="other_url"
          type="url"
          value={otherUrl}
          onChange={(e) => setOtherUrl(e.target.value)}
          placeholder="Demo, App Store, GitHub…"
        />
      </Field>

      <Button type="submit" size="lg" variant="abstract" className="w-fit">
        Review order
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}
