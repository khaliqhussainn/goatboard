import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { AD_SLOT_PRICING } from "@/lib/validation";
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
    };
  };
}

async function handleBoostOrder(
  campaignId: string,
  power: number,
  orderId: string,
  amountUsd: number,
  currency: string,
) {
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
 * Activates a paid ad slot: verifies the paid total actually matches the
 * price for the claimed duration (the checkout route already set the price
 * server-side, but the webhook trusts nothing either), then schedules it to
 * start when the current live/queued ad (if any) ends, or immediately.
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

  if (adSlot.status === "paid") {
    // Already processed (Lemon Squeezy retried the webhook) — no-op success.
    return true;
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

  const { data: current } = await admin
    .from("ad_slots")
    .select("ends_at")
    .eq("status", "paid")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const startsAt = current?.ends_at ? new Date(current.ends_at) : new Date();
  const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const { error: updateError } = await admin
    .from("ad_slots")
    .update({
      status: "paid",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      lemon_squeezy_order_id: orderId,
    })
    .eq("id", adSlotId);

  if (updateError) {
    console.error("ad slot webhook: activation failed", updateError);
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

  if (customData.ad_slot_id) {
    const durationDays = Number(customData.duration_days);
    if (customData.ad_slot_id && Number.isFinite(durationDays)) {
      ok = await handleAdSlotOrder(customData.ad_slot_id, durationDays, orderId);
    }
  } else if (customData.campaign_id) {
    const power = Number(customData.power);
    if (Number.isFinite(power) && power > 0) {
      ok = await handleBoostOrder(
        customData.campaign_id,
        power,
        orderId,
        total / 100,
        currency ?? "USD",
      );
    }
  }

  if (!ok) {
    return NextResponse.json({ message: "Failed to process order." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
