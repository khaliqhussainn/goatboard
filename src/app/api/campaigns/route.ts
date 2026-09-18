import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { campaignSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createListingCheckout } from "@/lib/lemonsqueezy";
import { isVoteGateSatisfied } from "@/lib/queries/vote-gate";
import { LISTING_CURRENCY, LISTING_PRICE_USD } from "@/lib/listing";
import { getSiteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`create-campaign:${visitorId}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { message: "You're creating campaigns too fast. Try again later." },
      { status: 429 },
    );
  }

  const ipLimit = rateLimit(`create-campaign-ip:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  // The vote gate, enforced here rather than in the browser. The UI locks
  // Continue until a vote lands, but that is a courtesy - this is the check
  // that actually holds, and it runs before anything is written.
  if (!(await isVoteGateSatisfied(visitorId))) {
    return NextResponse.json(
      { message: "Vote for a startup before listing yours.", code: "vote_required" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const base = slugify(parsed.data.name) || "campaign";

    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;

      const { data, error } = await admin
        .from("campaigns")
        .insert({
          slug,
          name: parsed.data.name,
          description: parsed.data.description,
          destination_url: parsed.data.destination_url,
          image_url: parsed.data.image_url || null,
          x_handle: parsed.data.x_handle || null,
          category: parsed.data.category,
          created_by: visitorId,
          // Invisible until the webhook says it was paid for. Every public
          // read filters on 'active', and cast_vote refuses anything else,
          // so nothing here is on the board yet.
          status: "pending_payment",
        })
        .select("id, slug")
        .single();

      if (!error && data) {
        // The creator's opening comment, if they wrote one. Best effort: a
        // campaign that published shouldn't fail because its first comment
        // didn't, so this never changes the response.
        const firstComment = parsed.data.first_comment?.trim();
        if (firstComment) {
          const { error: commentError } = await admin.from("campaign_comments").insert({
            campaign_id: data.id,
            author_id: visitorId,
            // The campaign's own required handle - no need to ask again.
            author_x_handle: parsed.data.x_handle,
            is_founder: true,
            body: firstComment,
          });
          if (commentError) console.error("first comment insert failed", commentError);
        }

        // From here the campaign exists but is not public. If any of this
        // fails the row is removed again rather than left as a draft nobody
        // can see, finish or find.
        try {
          const { data: order, error: orderError } = await admin
            .from("listing_orders")
            .insert({
              campaign_id: data.id,
              owner_id: visitorId,
              provider: "lemonsqueezy",
              amount: LISTING_PRICE_USD,
              currency: LISTING_CURRENCY,
              payment_status: "pending",
            })
            .select("id")
            .single();

          if (orderError || !order) {
            throw new Error(`listing order insert failed: ${orderError?.message}`);
          }

          const siteUrl = getSiteUrl(new URL(request.url).origin);
          const { url, variantId } = await createListingCheckout({
            orderId: order.id,
            campaignId: data.id,
            campaignName: parsed.data.name,
            redirectUrl: `${siteUrl}/mine?listing=complete`,
          });

          await admin
            .from("listing_orders")
            .update({ provider_variant_id: variantId })
            .eq("id", order.id);

          return NextResponse.json({ slug: data.slug, checkoutUrl: url }, { status: 201 });
        } catch (checkoutError) {
          console.error("listing checkout failed", checkoutError);
          await admin.from("campaigns").delete().eq("id", data.id);
          return NextResponse.json(
            { message: "Couldn't start checkout. Nothing was charged - try again." },
            { status: 502 },
          );
        }
      }

      if (error && error.code !== "23505") {
        console.error("campaign insert failed", error);
        return NextResponse.json(
          { message: `Couldn't publish your campaign: ${error.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: "Couldn't find a free slug. Try a different name." },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("campaign creation crashed", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `Couldn't publish your campaign: ${detail}` },
      { status: 500 },
    );
  }
}
