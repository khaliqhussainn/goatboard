import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

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
  const campaignId = payload.meta.custom_data?.campaign_id;
  const power = Number(payload.meta.custom_data?.power);
  const orderId = payload.data.id;

  if (status !== "paid" || !campaignId || !Number.isFinite(power) || power <= 0) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_purchase_power", {
    p_order_id: orderId,
    p_campaign_id: campaignId,
    p_amount: total / 100,
    p_currency: currency ?? "USD",
    p_power: power,
  });

  if (error) {
    console.error("grant_purchase_power failed", error);
    return NextResponse.json({ message: "Failed to process order." }, { status: 500 });
  }

  const result = data?.[0];
  if (!result?.success && result?.message !== "already_processed") {
    console.error("grant_purchase_power rejected", result);
    return NextResponse.json({ message: "Failed to process order." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
