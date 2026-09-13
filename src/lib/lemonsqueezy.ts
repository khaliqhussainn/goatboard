import "server-only";
import crypto from "node:crypto";
import { AD_SLOT_VARIANT_NAMES } from "@/lib/validation";
import type { AdSlotDuration } from "@/lib/types";

const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

interface CheckoutSessionParams {
  variantId: string;
  /** Omitted for fixed-price variants, so the variant's own price applies. */
  customPriceCents?: number;
  customData: Record<string, string>;
  productName: string;
  productDescription: string;
  redirectUrl: string;
}

/** Low-level Lemon Squeezy checkout creation shared by boosts and ad slots —
 * everything that varies between them is passed in, nothing here is boost- or
 * ad-specific. */
async function createCheckoutSession({
  variantId,
  customPriceCents,
  customData,
  productName,
  productDescription,
  redirectUrl,
}: CheckoutSessionParams): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    throw new Error("Lemon Squeezy is not configured.");
  }

  const res = await fetch(`${LEMONSQUEEZY_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          ...(customPriceCents === undefined ? {} : { custom_price: customPriceCents }),
          checkout_data: { custom: customData },
          product_options: {
            name: productName,
            description: productDescription,
            redirect_url: redirectUrl,
          },
          checkout_options: {
            embed: false,
            dark: false,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lemon Squeezy checkout failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) throw new Error("Lemon Squeezy did not return a checkout URL.");
  return url;
}

const variantIdsByName = new Map<string, string>();

/**
 * Looks up a variant's id from the name it carries in the Lemon Squeezy
 * dashboard. The checkout API only takes ids, but ids are opaque numbers
 * nobody wants to copy around by hand, so the durations are configured by
 * name (see AD_SLOT_VARIANT_NAMES) and resolved here. Cached for the life of
 * the process — variants effectively never change.
 */
async function resolveVariantIdByName(name: string): Promise<string> {
  const cached = variantIdsByName.get(name);
  if (cached) return cached;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("Lemon Squeezy is not configured.");

  // Brackets pre-encoded: Lemon Squeezy's JSON:API pagination params are
  // page[size], and leaving them raw is at the mercy of whoever normalises
  // the URL next.
  const res = await fetch(`${LEMONSQUEEZY_API}/variants?page%5Bsize%5D=100`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Lemon Squeezy variant lookup failed (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  const variants: { id: string; attributes?: { name?: string } }[] = json?.data ?? [];
  const wanted = name.trim().toLowerCase();
  const match = variants.find((v) => v.attributes?.name?.trim().toLowerCase() === wanted);

  if (!match) {
    const found = variants.map((v) => v.attributes?.name).filter(Boolean).join(", ");
    throw new Error(
      `Lemon Squeezy has no variant named "${name}". Variants found: ${found || "none"}.`,
    );
  }

  variantIdsByName.set(name, String(match.id));
  return String(match.id);
}

interface CreateCheckoutParams {
  campaignId: string;
  campaignName: string;
  amountUsd: number;
  power: number;
  redirectUrl: string;
}

/**
 * Creates a Lemon Squeezy checkout for a "pay what you want" variant, with
 * the campaign + power baked into custom_data so the webhook can trust
 * nothing from the client and still know what to credit.
 */
export async function createCheckout({
  campaignId,
  campaignName,
  amountUsd,
  power,
  redirectUrl,
}: CreateCheckoutParams): Promise<string> {
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!variantId) throw new Error("Lemon Squeezy is not configured.");

  return createCheckoutSession({
    variantId,
    customPriceCents: Math.round(amountUsd * 100),
    customData: { campaign_id: campaignId, power: String(power) },
    productName: `Boost - ${campaignName}`,
    productDescription: `+${power} Power on GOATBOARD`,
    redirectUrl,
  });
}

interface CreateAdSlotCheckoutParams {
  adSlotId: string;
  adSlotName: string;
  durationDays: AdSlotDuration;
  redirectUrl: string;
}

/** Per-duration overrides, for when the variants aren't named after them. */
const AD_VARIANT_ENV_VARS = {
  7: "LEMONSQUEEZY_AD_VARIANT_7",
  14: "LEMONSQUEEZY_AD_VARIANT_14",
  30: "LEMONSQUEEZY_AD_VARIANT_30",
} as const;

/**
 * Finds the variant to sell a given duration as.
 *
 * An explicit id in the environment wins, because a single-variant Lemon
 * Squeezy product calls its variant "Default" - there is nothing to match on
 * by name, and every such product would collide anyway. Falling back to the
 * name keeps a store whose variants are named after the duration working
 * with no environment setup at all.
 */
async function resolveAdVariantId(durationDays: AdSlotDuration): Promise<string> {
  const fromEnv = process.env[AD_VARIANT_ENV_VARS[durationDays]]?.trim();
  if (fromEnv) return fromEnv;

  return resolveVariantIdByName(AD_SLOT_VARIANT_NAMES[durationDays]);
}

/**
 * Creates a Lemon Squeezy checkout for renting the homepage ad slot, with
 * the ad_slots row id + duration baked into custom_data so the webhook can
 * trust nothing from the client and still know which row to activate and
 * for how long. Each duration is its own fixed-price variant, so no price is
 * passed - the variant's own price is what gets charged.
 */
export async function createAdSlotCheckout({
  adSlotId,
  adSlotName,
  durationDays,
  redirectUrl,
}: CreateAdSlotCheckoutParams): Promise<string> {
  const variantId = await resolveAdVariantId(durationDays);

  return createCheckoutSession({
    variantId,
    customData: { ad_slot_id: adSlotId, duration_days: String(durationDays) },
    productName: `Ad Space (${durationDays} days) - ${adSlotName}`,
    productDescription: `${durationDays}-day featured spot on GOATBOARD`,
    redirectUrl,
  });
}

/** Verifies the X-Signature header on an incoming webhook using the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const digestBuffer = Buffer.from(digest, "hex");

  if (sigBuffer.length !== digestBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}
