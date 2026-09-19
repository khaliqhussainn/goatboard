import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { bookAdSlot } from "@/lib/ad-slots";
import { bookVideoAd } from "@/lib/video-ads";
import { AD_SLOT_PRICING, POWER_PER_DOLLAR } from "@/lib/validation";
import { allowedGetListedAmounts, isGetListedPackageKey } from "@/lib/get-listed";
import { LISTING_PRICE_USD } from "@/lib/listing";
import type { AdSlotDuration } from "@/lib/types";

interface LemonSqueezyWebhookBody {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string;
    attributes: {
      status: string;
      total: number;
      currency: string;
      customer_id?: number | string | null;
    };
  };
}

/**
 * Grants Power for a paid boost.
 *
 * Power is computed here from `amountUsd` - what Lemon Squeezy's own
 * `total` field says was actually charged - rather than trusted from the
 * `power` custom_data baked in when the checkout session was created. The
 * boost variant is "pay what you want": a buyer can edit the amount on
 * Lemon Squeezy's own checkout page before paying, so a value fixed at
 * session-creation time can diverge from what was really paid. Recomputing
 * it here is what makes "never trust vote power from the client" hold even
 * though nothing in this request is literally client-submitted - it's
 * still client-influenced, several steps upstream, unless it's re-derived
 * from the one field Lemon Squeezy's signed payload actually guarantees.
 */
async function handleBoostOrder(campaignId: string, orderId: string, amountUsd: number, currency: string) {
  const power = Math.floor(amountUsd * POWER_PER_DOLLAR);
  if (power <= 0) {
    console.error("boost webhook: computed power is zero or negative", { amountUsd });
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_purchase_power", {
    p_order_id: orderId,
    p_campaign_id: campaignId,
    p_amount: amountUsd,
    p_currency: currency,
    p_power: power,
  });

  if (error) {
    console.error("grant_purchase_power failed", error);
    return false;
  }

  const result = data?.[0];
  if (!result?.success && result?.message !== "already_processed") {
    console.error("grant_purchase_power rejected", result);
    return false;
  }
  return true;
}

/**
 * Confirms a paid ad slot, booking it into the next free window in the queue.
 * Verifies the price on the row still matches what that duration costs (the
 * checkout route set it server-side, but the webhook trusts nothing either)
 * before handing off to bookAdSlot, which owns the scheduling and the
 * idempotency.
 */
async function handleAdSlotOrder(adSlotId: string, durationDays: number, orderId: string) {
  if (!(durationDays in AD_SLOT_PRICING)) {
    console.error("ad slot webhook: invalid duration_days", durationDays);
    return false;
  }

  const admin = createAdminClient();
  const { data: adSlot, error: fetchError } = await admin
    .from("ad_slots")
    .select("id, status, amount, duration_days")
    .eq("id", adSlotId)
    .single();

  if (fetchError || !adSlot) {
    console.error("ad slot webhook: row not found", adSlotId, fetchError);
    return false;
  }

  const expectedAmount = AD_SLOT_PRICING[durationDays as AdSlotDuration];
  if (Number(adSlot.amount) !== expectedAmount || adSlot.duration_days !== durationDays) {
    console.error(
      "ad slot webhook: price/duration mismatch",
      adSlot.amount,
      expectedAmount,
      adSlot.duration_days,
      durationDays,
    );
    return false;
  }

  const result = await bookAdSlot(admin, {
    adSlotId,
    durationDays: durationDays as AdSlotDuration,
    orderId,
  });

  if (!result.ok) {
    console.error("ad slot webhook: booking failed", adSlotId, result.reason);
    return false;
  }
  return true;
}

/**
 * Confirms a paid video ad, booking it into the next free window in the
 * queue — same shape as handleAdSlotOrder, but there's no per-duration price
 * to cross-check since the video spot only ever sells as one fixed $10/7-day
 * variant.
 */
async function handleVideoAdOrder(videoAdId: string, orderId: string) {
  const admin = createAdminClient();
  const result = await bookVideoAd(admin, { videoAdId, orderId });

  if (!result.ok) {
    console.error("video ad webhook: booking failed", videoAdId, result.reason);
    return false;
  }
  return true;
}

/**
 * Confirms a paid Get Listed order.
 *
 * The webhook decides nothing about money: it looks the package up from the
 * order row written at checkout time, resolves that package's price from
 * config, and hands both to activate_get_listed_order, which refuses the
 * activation if the stored amount disagrees. Replays are absorbed by that
 * function (the order only ever leaves 'pending' once) and by the unique
 * constraint on provider_order_id.
 */
async function handleGetListedOrder(
  orderRowId: string,
  providerOrderId: string,
  customerId: string | null,
) {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("get_listed_orders")
    .select("id, package_key, amount, payment_status")
    .eq("id", orderRowId)
    .maybeSingle();

  if (error || !order) {
    console.error("get listed webhook: order row not found", orderRowId, error);
    return false;
  }

  if (!isGetListedPackageKey(order.package_key)) {
    console.error("get listed webhook: unknown package", order.package_key);
    return false;
  }

  // An order created during the sale can be paid for after it ends, so the
  // check is "is this one of the prices this package is sold at" rather than
  // "is this today's price" - the latter would reject exactly the orders that
  // were charged correctly.
  const stored = Number(order.amount);
  if (!allowedGetListedAmounts(order.package_key).includes(stored)) {
    console.error("get listed webhook: amount not a valid price", order.package_key, stored);
    return false;
  }

  const { data, error: rpcError } = await admin.rpc("activate_get_listed_order", {
    p_order_id: order.id,
    p_provider_order_id: providerOrderId,
    p_expected_amount: stored,
    p_provider_customer_id: customerId,
  });

  if (rpcError) {
    console.error("activate_get_listed_order failed", rpcError);
    return false;
  }

  const result = data?.[0];
  if (!result?.success) {
    console.error("activate_get_listed_order rejected", result);
    return false;
  }
  return true;
}

/**
 * Confirms a paid campaign listing and publishes the campaign.
 *
 * Like the Get Listed handler, this decides nothing about money: it reads the
 * amount off the order row written at checkout time, checks it is still the
 * listing price, and lets activate_listing_order do the rest. Replays are
 * absorbed there - the order only ever leaves 'pending' once - and again by
 * the unique constraint on provider_order_id, so no amount of duplicate
 * deliveries can publish a campaign twice or publish a second one.
 */
async function handleListingOrder(
  orderRowId: string,
  providerOrderId: string,
  customerId: string | null,
) {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("listing_orders")
    .select("id, amount, payment_status")
    .eq("id", orderRowId)
    .maybeSingle();

  if (error || !order) {
    console.error("listing webhook: order row not found", orderRowId, error);
    return false;
  }

  const stored = Number(order.amount);
  if (stored !== LISTING_PRICE_USD) {
    console.error("listing webhook: amount is not the listing price", stored);
    return false;
  }

  const { data, error: rpcError } = await admin.rpc("activate_listing_order", {
    p_order_id: order.id,
    p_provider_order_id: providerOrderId,
    p_expected_amount: stored,
    p_provider_customer_id: customerId,
  });

  if (rpcError) {
    console.error("activate_listing_order failed", rpcError);
    return false;
  }

  const result = data?.[0];
  if (!result?.success) {
    console.error("activate_listing_order rejected", result);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    // Acknowledge everything else (subscription events, refunds, etc.) so
    // Lemon Squeezy doesn't retry — we only act on the initial paid order.
    return NextResponse.json({ received: true });
  }

  const { status, total, currency } = payload.data.attributes;
  const orderId = payload.data.id;
  if (status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const customData = payload.meta.custom_data ?? {};
  let ok = true;

  // Ordered most specific first. A listing order also carries a campaign id,
  // so it has to be recognised before the boost branch below, which would
  // otherwise try to grant Power for it.
  if (customData.listing_order_id) {
    const customerId = payload.data.attributes.customer_id;
    ok = await handleListingOrder(
      customData.listing_order_id,
      orderId,
      customerId === undefined || customerId === null ? null : String(customerId),
    );
  } else if (customData.get_listed_order_id) {
    const customerId = payload.data.attributes.customer_id;
    ok = await handleGetListedOrder(
      customData.get_listed_order_id,
      orderId,
      customerId === undefined || customerId === null ? null : String(customerId),
    );
  } else if (customData.ad_slot_id) {
    const durationDays = Number(customData.duration_days);
    if (customData.ad_slot_id && Number.isFinite(durationDays)) {
      ok = await handleAdSlotOrder(customData.ad_slot_id, durationDays, orderId);
    }
  } else if (customData.video_ad_id) {
    ok = await handleVideoAdOrder(customData.video_ad_id, orderId);
  } else if (customData.campaign_id) {
    ok = await handleBoostOrder(customData.campaign_id, orderId, total / 100, currency ?? "USD");
  }

  if (!ok) {
    return NextResponse.json({ message: "Failed to process order." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
