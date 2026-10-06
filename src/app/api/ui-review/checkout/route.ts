import { NextResponse } from "next/server";
import { createUiReviewCheckout } from "@/lib/lemonsqueezy";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { UI_REVIEW_PLANS } from "@/lib/ui-review";
import { getSiteUrl } from "@/lib/utils";
import { uiReviewCheckoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`ui-review-checkout:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many checkout attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = uiReviewCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  try {
    const plan = UI_REVIEW_PLANS[parsed.data.plan_key];
    const admin = createAdminClient();
    const { data: order, error: insertError } = await admin
      .from("ui_review_orders")
      .insert({
        plan_key: parsed.data.plan_key,
        product_url: parsed.data.product_url,
        review_notes: parsed.data.review_notes || null,
        x_handle: parsed.data.x_handle,
        amount: plan.priceUsd,
        currency: "USD",
        provider: "lemonsqueezy",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !order) {
      console.error("UI Review order creation failed", insertError);
      return NextResponse.json(
        { message: "Couldn't save your UI Review brief. Try again." },
        { status: 500 },
      );
    }

    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const { url, variantId } = await createUiReviewCheckout({
      orderId: order.id,
      planKey: parsed.data.plan_key,
      productUrl: parsed.data.product_url,
      redirectUrl: `${siteUrl}/ui-review?checkout=complete`,
    });

    const { error: updateError } = await admin
      .from("ui_review_orders")
      .update({ provider_variant_id: variantId })
      .eq("id", order.id);
    if (updateError) console.error("UI Review variant tracking failed", order.id, updateError);

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
    } else {
      console.error("UI Review checkout failed", error);
    }
    return NextResponse.json(
      { message: "UI Review checkout isn't available right now. Try again shortly." },
      { status: 502 },
    );
  }
}
