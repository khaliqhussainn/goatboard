import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { createGetListedCheckout } from "@/lib/lemonsqueezy";
import { getListedCheckoutSchema } from "@/lib/validation";
import { getListedPackage } from "@/lib/get-listed";
import { getVisitorId } from "@/lib/visitor";
import { getSiteUrl } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Opens checkout for a campaign the caller owns.
 *
 * The request carries a campaign id and nothing else. The package comes off
 * the stored campaign, the price comes from the package config, and the order
 * row is written server-side before the checkout exists - so the amount the
 * webhook later verifies against was never in the client's hands at any point.
 */
export async function POST(request: Request) {
  const ownerId = await getVisitorId();
  if (!ownerId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`get-listed-checkout:${ownerId}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json({ message: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = getListedCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Ownership check: filtering on owner_id means someone else's campaign id
    // is indistinguishable from one that doesn't exist.
    const { data: campaign } = await admin
      .from("get_listed_campaigns")
      .select("id, owner_id, package_key, startup_name, status, terms_accepted_at")
      .eq("id", parsed.data.campaignId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
    }

    if (!campaign.terms_accepted_at) {
      return NextResponse.json(
        { message: "You need to accept the Terms of Service first." },
        { status: 400 },
      );
    }

    if (campaign.status !== "draft" && campaign.status !== "awaiting_payment") {
      return NextResponse.json(
        { message: "This campaign has already been paid for." },
        { status: 409 },
      );
    }

    const pkg = getListedPackage(campaign.package_key);

    // Reuse an unpaid order for this campaign rather than stacking up a new
    // row per checkout attempt; a buyer who backs out and retries should not
    // leave a trail of pending orders.
    const { data: existing } = await admin
      .from("get_listed_orders")
      .select("id, payment_status")
      .eq("campaign_id", campaign.id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId = existing?.id ?? null;

    if (!orderId) {
      const { data: order, error } = await admin
        .from("get_listed_orders")
        .insert({
          campaign_id: campaign.id,
          owner_id: ownerId,
          provider: "lemonsqueezy",
          package_key: pkg.key,
          // Server-resolved price. The webhook checks the paid order against
          // this exact number.
          amount: pkg.priceUsd,
          currency: pkg.currency,
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (error || !order) {
        console.error("get_listed order insert failed", error);
        return NextResponse.json({ message: "Couldn't start checkout." }, { status: 500 });
      }
      orderId = order.id;
    }

    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const { url, variantId } = await createGetListedCheckout({
      orderId,
      campaignId: campaign.id,
      packageKey: pkg.key,
      startupName: campaign.startup_name,
      redirectUrl: `${siteUrl}/my-campaigns/${campaign.id}?checkout=complete`,
    });

    await admin
      .from("get_listed_orders")
      .update({ provider_variant_id: variantId })
      .eq("id", orderId);

    // Awaiting payment, not paid. Only the webhook moves this further.
    await admin
      .from("get_listed_campaigns")
      .update({ status: "awaiting_payment" })
      .eq("id", campaign.id)
      .eq("status", "draft");

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("get_listed checkout failed", error);
    return NextResponse.json(
      { message: "Checkout isn't available right now. Try again shortly." },
      { status: 500 },
    );
  }
}
