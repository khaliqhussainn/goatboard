import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit } from "@/lib/rate-limit";
import { createListingCheckout } from "@/lib/lemonsqueezy";
import { LISTING_CURRENCY, LISTING_PRICE_USD } from "@/lib/listing";
import { getSiteUrl } from "@/lib/utils";

/**
 * Restarts the checkout for a campaign that was created but never paid for.
 *
 * Someone who closes the Lemon Squeezy tab is left with a campaign nobody can
 * see and no way back to it; this is that way back. It reuses the existing
 * pending order rather than opening a second one, so an abandoned attempt and
 * the one that eventually pays are the same row - which is what keeps the
 * webhook's idempotency meaningful.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`listing-resume:${visitorId}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  try {
    const admin = createAdminClient();

    // Ownership is the visitor cookie, the same key the rest of the board
    // runs on. Scoped in the query rather than checked afterwards.
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id, name, status")
      .eq("id", id)
      .eq("created_by", visitorId)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
    }
    if (campaign.status !== "pending_payment") {
      return NextResponse.json(
        { message: "This campaign isn't waiting on a payment." },
        { status: 409 },
      );
    }

    const { data: order } = await admin
      .from("listing_orders")
      .select("id, payment_status")
      .eq("campaign_id", campaign.id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId = order?.id;
    if (!orderId) {
      const { data: created, error } = await admin
        .from("listing_orders")
        .insert({
          campaign_id: campaign.id,
          owner_id: visitorId,
          provider: "lemonsqueezy",
          amount: LISTING_PRICE_USD,
          currency: LISTING_CURRENCY,
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("listing order re-create failed", error);
        return NextResponse.json({ message: "Couldn't start checkout." }, { status: 500 });
      }
      orderId = created.id;
    }

    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const { url, variantId } = await createListingCheckout({
      orderId,
      campaignId: campaign.id,
      campaignName: campaign.name,
      redirectUrl: `${siteUrl}/mine?listing=complete`,
    });

    await admin.from("listing_orders").update({ provider_variant_id: variantId }).eq("id", orderId);

    return NextResponse.json({ checkoutUrl: url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("listing checkout resume crashed", error);
    return NextResponse.json({ message: "Couldn't start checkout." }, { status: 500 });
  }
}
