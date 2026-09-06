import "server-only";
import crypto from "node:crypto";

const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

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
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
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
          checkout_data: {
            custom: {
              campaign_id: campaignId,
              power: String(power),
            },
            custom_price: Math.round(amountUsd * 100),
          },
          product_options: {
            name: `Boost - ${campaignName}`,
            description: `+${power} Power on GOATBOARD`,
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
