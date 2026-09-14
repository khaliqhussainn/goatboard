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
    includes: [
      "30+ directory submissions",
      "Relevant startup directories",
      "GOATBOARD listing",
      "Submission tracking",
      "Submission report",
    ],
  },
  big_goat: {
    key: "big_goat",
    name: "Big Goat",
    submissionTarget: 60,
    priceUsd: 89,
    currency: "USD",
    variantEnvVar: "GET_LISTED_BIG_GOAT_VARIANT_ID",
    summary: "60+ submissions",
    includes: [
      "60+ directory submissions",
      "Relevant startup directories",
      "Niche and vertical directories",
      "Startup and founder communities",
      "GOATBOARD listing",
      "Submission tracking",
      "Submission report",
    ],
  },
  goat_mode: {
    key: "goat_mode",
    name: "Goat Mode",
    submissionTarget: 100,
    priceUsd: 149,
    currency: "USD",
    variantEnvVar: "GET_LISTED_GOAT_MODE_VARIANT_ID",
    summary: "100+ submissions",
    includes: [
      "100+ directory submissions",
      "Relevant startup directories",
      "Niche and vertical directories",
      "Startup and founder communities",
      "Launch and discovery platforms",
      "GOATBOARD listing",
      "Priority processing",
      "Submission tracking",
      "Submission report",
    ],
  },
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
    title: "Pick a package and tell us about your startup",
    body: "Name, website, a short description and your links. Takes a couple of minutes.",
  },
  {
    step: "02",
    title: "Pay and we start submitting",
    body: "Once payment clears, your campaign is queued and we begin working through the directories by hand.",
  },
  {
    step: "03",
    title: "Track it as it happens",
    body: "Every submission appears in your campaign with its real status - submitted, accepted or rejected - and a final report when we're done.",
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
