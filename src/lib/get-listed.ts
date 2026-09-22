/**
 * Get Listed: the paid startup distribution service.
 *
 * Everything about a package lives here and nowhere else - the client sends
 * only a package key, and the server resolves the price and the Lemon Squeezy
 * variant from this table. Nothing in this file is secret, so it is safe to
 * import from client components; the variant ids themselves are read from the
 * environment server-side (see resolveGetListedVariantId in lemonsqueezy.ts).
 *
 * To change pricing: edit priceUsd here. To point a package at a different
 * Lemon Squeezy variant: change the env var named by variantEnvVar.
 */

export const GET_LISTED_PACKAGE_KEYS = ["baby_goat", "big_goat", "goat_mode"] as const;
export type GetListedPackageKey = (typeof GET_LISTED_PACKAGE_KEYS)[number];

export type GetListedPackage = {
  key: GetListedPackageKey;
  name: string;
  /** The number of submissions the package is sold as targeting. */
  submissionTarget: number;
  priceUsd: number;
  currency: "USD";
  /** Env var holding this package's Lemon Squeezy variant id. */
  variantEnvVar: string;
  summary: string;
  /** Who the package is for, under the name on the pricing card. */
  tagline: string;
  /** The handwritten line at the foot of the pricing card. */
  footnote: string;
  includes: string[];
};

export const GET_LISTED_PACKAGES: Record<GetListedPackageKey, GetListedPackage> = {
  baby_goat: {
    key: "baby_goat",
    name: "Baby Goat",
    submissionTarget: 30,
    priceUsd: 49,
    currency: "USD",
    variantEnvVar: "GET_LISTED_BABY_GOAT_VARIANT_ID",
    summary: "30+ submissions",
    tagline: "Perfect for early-stage founders.",
    footnote: "Small steps.\nBig exposure.",
    includes: [
      "Relevant directories",
      "Manual submission",
      "Submission tracking",
      "Final report",
    ],  },
  big_goat: {
    key: "big_goat",
    name: "Big Goat",
    submissionTarget: 60,
    priceUsd: 89,
    currency: "USD",
    variantEnvVar: "GET_LISTED_BIG_GOAT_VARIANT_ID",
    summary: "60+ submissions",
    tagline: "For growing businesses & startups.",
    footnote: "More reach.\nMore opportunities.",
    includes: [
      "Relevant directories",
      "Manual submission",
      "Submission tracking",
      "Final report",
    ],  },
  goat_mode: {
    key: "goat_mode",
    name: "Goat Mode",
    submissionTarget: 100,
    priceUsd: 149,
    currency: "USD",
    variantEnvVar: "GET_LISTED_GOAT_MODE_VARIANT_ID",
    summary: "100+ submissions",
    tagline: "For established brands & larger reach.",
    footnote: "Bigger goals.\nMore exposure.",
    includes: [
      "Relevant directories",
      "Manual submission",
      "Submission tracking",
      "Final report",
    ],  },
};

/** Display order for the pricing list. */
export const GET_LISTED_PACKAGE_LIST: GetListedPackage[] = GET_LISTED_PACKAGE_KEYS.map(
  (key) => GET_LISTED_PACKAGES[key],
);

export function isGetListedPackageKey(value: unknown): value is GetListedPackageKey {
  return (
    typeof value === "string" &&
    (GET_LISTED_PACKAGE_KEYS as readonly string[]).includes(value)
  );
}

export function getListedPackage(key: GetListedPackageKey): GetListedPackage {
  return GET_LISTED_PACKAGES[key];
}

/**
 * Launch-week promotion.
 *
 * The server is the only thing that decides what anyone pays: the checkout
 * route prices the order from promoPrice() and sends that as the checkout's
 * custom_price, which overrides the variant's own figure. The countdown on
 * the page is display, and could be a minute out without affecting a charge.
 *
 * It ends by itself. Nothing needs deploying when the week is up - every
 * price, badge and countdown on the page is derived from endsAt.
 */
export const GET_LISTED_PROMO = {
  percentOff: 50,
  /** The instant the sale stops. Change this to extend or end it early. */
  endsAt: "2026-09-22T23:59:59.000Z",
  label: "Launch week",
} as const;

export function isPromoActive(now: number = Date.now()): boolean {
  return now < Date.parse(GET_LISTED_PROMO.endsAt);
}

/** What a package costs right now, in whole dollars and cents. */
export function promoPrice(pkg: GetListedPackage, now: number = Date.now()): number {
  if (!isPromoActive(now)) return pkg.priceUsd;
  return Math.round(pkg.priceUsd * (100 - GET_LISTED_PROMO.percentOff)) / 100;
}

/**
 * Every amount an order for this package is allowed to have been created at.
 *
 * The webhook checks the stored amount against this rather than against one
 * price, because an order placed during the sale can be paid for after it
 * ends - recomputing the price at webhook time would reject exactly the
 * orders that were charged correctly.
 */
export function allowedGetListedAmounts(key: GetListedPackageKey): number[] {
  const pkg = GET_LISTED_PACKAGES[key];
  const discounted = Math.round(pkg.priceUsd * (100 - GET_LISTED_PROMO.percentOff)) / 100;
  return [pkg.priceUsd, discounted];
}

/** What the service does and does not promise. Rendered on the sales page and
 *  repeated in the Terms, so the two can never drift apart. */
export const GET_LISTED_DISCLOSURES = [
  "GOATBOARD submits your startup to third-party directories, communities and discovery platforms on your behalf.",
  "Directory acceptance is not guaranteed. Each directory decides independently whether to list you, and some reject submissions or never respond.",
  "The submission count is the number of submissions the package targets, not a number of guaranteed live listings.",
  "GOATBOARD does not control third-party directories, their review times, or their listing policies.",
  "Refunds and cancellations are handled under the Refund Policy.",
] as const;

export const GET_LISTED_STEPS = [
  {
    step: "01",
    icon: "FileText",
    title: "Tell us about your startup",
    body: "Share your basic info - name, website, description, category and more.",
  },
  {
    step: "02",
    icon: "Search",
    title: "We find relevant platforms",
    body: "We select the directories and discovery channels that actually fit what you built.",
  },
  {
    step: "03",
    icon: "Send",
    title: "We submit",
    body: "Your startup gets manually submitted to each platform by our team.",
  },
  {
    step: "04",
    icon: "BarChart3",
    title: "Track everything",
    body: "See your submission progress and get a final report when it's done.",
  },
] as const;

/** Campaign lifecycle. Payment and fulfilment are separate: paying moves a
 *  campaign to "active", and only an admin moves it through delivery. */
export const GET_LISTED_CAMPAIGN_STATUSES = [
  "draft",
  "awaiting_payment",
  "active",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type GetListedCampaignStatus = (typeof GET_LISTED_CAMPAIGN_STATUSES)[number];

export const GET_LISTED_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type GetListedPaymentStatus = (typeof GET_LISTED_PAYMENT_STATUSES)[number];

export const GET_LISTED_SUBMISSION_STATUSES = [
  "pending",
  "submitted",
  "accepted",
  "rejected",
] as const;
export type GetListedSubmissionStatus = (typeof GET_LISTED_SUBMISSION_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<GetListedCampaignStatus, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  active: "Paid - queued",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<GetListedPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const SUBMISSION_STATUS_LABELS: Record<GetListedSubmissionStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
};

/** Progress derived from real submission rows - never a stored counter. */
export function submissionProgress(
  submissions: { status: GetListedSubmissionStatus }[],
  target: number,
) {
  const counts = { pending: 0, submitted: 0, accepted: 0, rejected: 0 };
  for (const s of submissions) counts[s.status] += 1;

  // "Sent" is anything that has actually left our hands, whatever the
  // directory decided afterwards.
  const sent = counts.submitted + counts.accepted + counts.rejected;
  return {
    ...counts,
    total: submissions.length,
    sent,
    target,
    percent: target > 0 ? Math.min(100, Math.round((sent / target) * 100)) : 0,
  };
}
