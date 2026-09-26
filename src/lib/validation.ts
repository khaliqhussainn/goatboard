import { z } from "zod";
import {
  GET_LISTED_BACKLINK_STATUSES,
  GET_LISTED_REQUIREMENT_TYPES,
  GET_LISTED_SUBMISSION_STATUSES,
} from "@/lib/get-listed";

const SAFE_URL_PROTOCOLS = ["http:", "https:"];

export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_URL_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * A required X handle, stored without the leading "@".
 *
 * Every paid or published thing on the board carries one: it is the public
 * reply channel and makes a listing traceable to an account that can actually
 * be reached. Shared rather than repeated so the five
 * forms that ask for it can't drift on what counts as valid - X itself caps
 * handles at 15 characters of [A-Za-z0-9_].
 */
export const xHandleSchema = z
  .string({ error: "An X handle is required." })
  .trim()
  .transform((v) => v.replace(/^@/, ""))
  .refine((v) => v.length > 0, "An X handle is required.")
  .refine((v) => /^[A-Za-z0-9_]{1,15}$/.test(v), "Enter a valid X handle.");

export const campaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give it a name (2+ characters).")
    .max(60, "Keep it under 60 characters."),
  description: z
    .string()
    .trim()
    .min(4, "Tell people what this is.")
    .max(280, "Keep it under 280 characters."),
  destination_url: z
    .string()
    .trim()
    .min(1, "A destination link is required.")
    .refine(isSafeUrl, "Enter a valid http(s) URL."),
  image_urls: z
    .array(z.string().trim().refine(isSafeUrl, "Enter a valid image URL."))
    .min(1, "Add at least one image.")
    .max(5, "You can add up to five images."),
  email: z.string().trim().email("Enter a valid campaign email.").max(254),
  maker_name: z
    .string()
    .trim()
    .min(2, "Enter the maker's name.")
    .max(80, "Keep the maker name under 80 characters."),
  maker_email: z.string().trim().email("Enter a valid maker email.").max(254),
  pricing_model: z.enum(["free", "freemium", "paid"], {
    error: "Choose a pricing model.",
  }),
  // Required: every listing has to be traceable to a public account that can
  // be replied to. Private campaign emails are validated separately above.
  x_handle: xHandleSchema,
  category: z.enum([
    "product",
    "startup",
    "website",
    "app",
    "creator",
    "music",
    "meme",
    "cause",
    "game",
    "other",
  ]),
  // The creator's own opening comment, posted with the campaign. Optional -
  // an empty string means they skipped it.
  first_comment: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters.")
    .optional()
    .nullable(),
});

export const COMMENT_MAX = 500;
export const COMMENT_HANDLE_MAX = 15;

export const commentSchema = z.object({
  campaignId: z.string().uuid(),
  // A real, checkable account instead of a free-text name nobody can verify.
  // Attribution still runs on the visitor cookie in author_id - this is just
  // the label shown.
  authorXHandle: xHandleSchema,
  body: z
    .string()
    .trim()
    .min(1, "Say something first.")
    .max(COMMENT_MAX, `Keep it under ${COMMENT_MAX} characters.`),
  // Set when replying to another comment. /api/comments flattens a reply to
  // a reply so this always ends up pointing at a top-level comment.
  parentId: z.string().uuid().optional().nullable(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const BOOST_MIN_AMOUNT = 1;
export const BOOST_MAX_AMOUNT = 5000;
export const POWER_PER_DOLLAR = 3;

export const boostSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z
    .number()
    .int("Whole dollars only.")
    .min(BOOST_MIN_AMOUNT, `Minimum boost is $${BOOST_MIN_AMOUNT}.`)
    .max(BOOST_MAX_AMOUNT, `Maximum boost is $${BOOST_MAX_AMOUNT}.`),
});

export const BOOST_PRESETS = [1, 2, 3, 5, 10, 25, 50, 100] as const;

export const reportSchema = z.object({
  campaignId: z.string().uuid(),
  reason: z.string().trim().min(3, "Say a bit more.").max(500, "Keep it under 500 characters."),
});

/** Duration -> price in whole USD. The only prices /api/ad-checkout and the
 * webhook will ever charge/accept — never trust a client-submitted amount. */
export const AD_SLOT_PRICING = { 7: 5, 14: 8, 30: 15 } as const;
export const AD_SLOT_DURATIONS = [7, 14, 30] as const;

/** The Lemon Squeezy variant each duration is sold as. Matched by name at
 * checkout time rather than by a hardcoded id, so these only have to agree
 * with what the variants are actually called in the dashboard. */
export const AD_SLOT_VARIANT_NAMES = {
  7: "7 days",
  14: "14 days",
  30: "30 days",
} as const;

export const adSlotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give it a name (2+ characters).")
    .max(60, "Keep it under 60 characters."),
  description: z
    .string()
    .trim()
    .min(4, "Tell people what this is.")
    .max(140, "Keep it under 140 characters."),
  destination_url: z
    .string()
    .trim()
    .min(1, "A destination link is required.")
    .refine(isSafeUrl, "Enter a valid http(s) URL."),
  image_url: z
    .string()
    .trim()
    .refine((v) => v === "" || isSafeUrl(v), "Enter a valid image URL.")
    .optional()
    .nullable(),
  backdrop_url: z
    .string()
    .trim()
    .refine((v) => v === "" || isSafeUrl(v), "Enter a valid image URL.")
    .optional()
    .nullable(),
  duration_days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  x_handle: xHandleSchema,
});

export type AdSlotInput = z.infer<typeof adSlotSchema>;

export const adCheckoutSchema = z.object({
  adSlotId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Video ads — a single fixed $10/7-day autoplay video spot beside the ad slot.
// ---------------------------------------------------------------------------
export const VIDEO_AD_PRICE_USD = 10;

/** Where paid ad videos are stored. Named here rather than in lib/storage.ts
 *  because the browser needs it too: the file goes straight from the uploader
 *  to Supabase Storage, and lib/storage.ts is server-only. */
export const AD_VIDEO_BUCKET = "ad-videos";

/** Must stay in step with the bucket's own file_size_limit in schema.sql,
 *  which is what actually enforces this - a client can claim any size. */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const videoAdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give it a name (2+ characters).")
    .max(60, "Keep it under 60 characters."),
  destination_url: z
    .string()
    .trim()
    .min(1, "A destination link is required.")
    .refine(isSafeUrl, "Enter a valid http(s) URL."),
  video_url: z
    .string()
    .trim()
    .min(1, "Upload a video first.")
    .refine(isSafeUrl, "Enter a valid video URL."),
  x_handle: xHandleSchema,
});

export type VideoAdInput = z.infer<typeof videoAdSchema>;

export const videoCheckoutSchema = z.object({
  videoAdId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Get Listed (paid startup distribution service)
//
// The client sends a package key and never a price. Every amount charged is
// resolved server-side from GET_LISTED_PACKAGES.
// ---------------------------------------------------------------------------

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isSafeUrl(v), "Enter a valid http(s) URL.")
  .optional()
  .nullable();

export const getListedCampaignSchema = z.object({
  package_key: z.enum(["baby_goat", "big_goat", "goat_mode"]),
  startup_name: z
    .string()
    .trim()
    .min(2, "Give your startup a name (2+ characters).")
    .max(80, "Keep it under 80 characters."),
  website_url: z
    .string()
    .trim()
    .min(1, "A website link is required.")
    .refine(isSafeUrl, "Enter a valid http(s) URL."),
  description: z
    .string()
    .trim()
    .min(4, "Tell us what your startup does.")
    .max(500, "Keep it under 500 characters."),
  category: z.enum([
    "product",
    "startup",
    "website",
    "app",
    "creator",
    "music",
    "meme",
    "cause",
    "game",
    "other",
  ]),
  // The buyer's own handle, required — distinct from x_url below, which is
  // the startup's profile and stays optional because it's one of several
  // links we pass on to directories.
  x_handle: xHandleSchema,
  x_url: optionalUrl,
  linkedin_url: optionalUrl,
  other_url: optionalUrl,
  // Checkout is refused without this; the acceptance time is stored on the row.
  accept_terms: z.literal(true, {
    message: "You need to accept the Terms of Service to continue.",
  }),
});

export type GetListedCampaignInput = z.infer<typeof getListedCampaignSchema>;

export const getListedCheckoutSchema = z.object({
  campaignId: z.string().uuid(),
});

export const getListedSubmissionSchema = z.object({
  campaign_id: z.string().uuid(),
  directory_name: z
    .string()
    .trim()
    .min(1, "Directory name is required.")
    .max(120, "Keep it under 120 characters."),
  directory_url: optionalUrl,
  status: z.enum(GET_LISTED_SUBMISSION_STATUSES).optional(),
  listing_url: optionalUrl,
  requirement_type: z.enum(GET_LISTED_REQUIREMENT_TYPES).optional(),
  backlink_status: z.enum(GET_LISTED_BACKLINK_STATUSES).optional(),
  backlink_instructions: z.string().trim().max(2000).optional().nullable(),
  badge_code: z.string().trim().max(10_000).optional().nullable(),
  backlink_url: optionalUrl,
  public_notes: z.string().trim().max(2000).optional().nullable(),
  internal_notes: z.string().trim().max(2000).optional().nullable(),
  visible_to_client: z.boolean().optional(),
  submitted_at: z.iso.datetime().optional().nullable(),
  last_checked_at: z.iso.datetime().optional().nullable(),
  backlink_verified_at: z.iso.datetime().optional().nullable(),
});

export const getListedSubmissionUpdateSchema = z.object({
  directory_name: z.string().trim().min(1).max(120).optional(),
  directory_url: optionalUrl,
  status: z.enum(GET_LISTED_SUBMISSION_STATUSES).optional(),
  listing_url: optionalUrl,
  requirement_type: z.enum(GET_LISTED_REQUIREMENT_TYPES).optional(),
  backlink_status: z.enum(GET_LISTED_BACKLINK_STATUSES).optional(),
  backlink_instructions: z.string().trim().max(2000).optional().nullable(),
  badge_code: z.string().trim().max(10_000).optional().nullable(),
  backlink_url: optionalUrl,
  public_notes: z.string().trim().max(2000).optional().nullable(),
  internal_notes: z.string().trim().max(2000).optional().nullable(),
  visible_to_client: z.boolean().optional(),
  submitted_at: z.iso.datetime().optional().nullable(),
  last_checked_at: z.iso.datetime().optional().nullable(),
  backlink_verified_at: z.iso.datetime().optional().nullable(),
});

export const getListedCampaignStatusSchema = z.object({
  status: z.enum([
    "draft",
    "awaiting_payment",
    "active",
    "in_progress",
    "completed",
    "cancelled",
  ]),
});
