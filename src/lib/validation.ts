import { z } from "zod";

const SAFE_URL_PROTOCOLS = ["http:", "https:"];

export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_URL_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

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
  image_url: z
    .string()
    .trim()
    .refine((v) => v === "" || isSafeUrl(v), "Enter a valid image URL.")
    .optional()
    .nullable(),
  x_handle: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .refine((v) => v === "" || /^[A-Za-z0-9_]{1,15}$/.test(v), "Enter a valid X handle.")
    .optional()
    .nullable(),
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
});

export type AdSlotInput = z.infer<typeof adSlotSchema>;

export const adCheckoutSchema = z.object({
  adSlotId: z.string().uuid(),
});
