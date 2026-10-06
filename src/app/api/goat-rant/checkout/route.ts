import { NextResponse } from "next/server";
import { createGoatRantCheckout } from "@/lib/lemonsqueezy";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/utils";
import { GOAT_RANT_PRICE_USD, goatRantCheckoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`goat-rant-checkout:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many checkout attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = goatRantCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const { data: order, error: insertError } = await admin
      .from("goat_rant_orders")
      .insert({
        product_url: parsed.data.product_url,
        video_notes: parsed.data.video_notes || null,
        x_handle: parsed.data.x_handle,
        rant_id: parsed.data.rant_id ?? null,
        amount: GOAT_RANT_PRICE_USD,
        currency: "USD",
        provider: "lemonsqueezy",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !order) {
      console.error("GOAT Rant order creation failed", insertError);
      return NextResponse.json(
        { message: "Couldn't save your GOAT Rant brief. Try again." },
        { status: 500 },
      );
    }

    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const { url, variantId } = await createGoatRantCheckout({
      orderId: order.id,
      productUrl: parsed.data.product_url,
      redirectUrl: `${siteUrl}/roast?checkout=complete`,
    });

    const { error: updateError } = await admin
      .from("goat_rant_orders")
      .update({ provider_variant_id: variantId })
      .eq("id", order.id);
    if (updateError) console.error("GOAT Rant variant tracking failed", order.id, updateError);

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
    } else {
      console.error("GOAT Rant checkout failed", error);
    }
    return NextResponse.json(
      { message: "GOAT Rant checkout isn't available right now. Try again shortly." },
      { status: 502 },
    );
  }
}
