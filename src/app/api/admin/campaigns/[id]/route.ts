import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignSchema } from "@/lib/validation";

const statusBodySchema = z.object({ status: z.enum(["active", "suspended", "removed"]) });
const detailsBodySchema = campaignSchema.omit({ first_comment: true });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const admin = createAdminClient();

  const statusBody = statusBodySchema.safeParse(body);
  if (!statusBody.success) {
    const detailsBody = detailsBodySchema.safeParse(body);
    if (!detailsBody.success) {
      return NextResponse.json(
        { message: detailsBody.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 },
      );
    }

    const details = detailsBody.data;
    const { error: contactError } = await admin.from("campaign_contacts").upsert(
      {
        campaign_id: id,
        email: details.email,
        maker_email: details.maker_email,
      },
      { onConflict: "campaign_id" },
    );
    if (contactError) {
      console.error("admin campaign contact update failed", contactError);
      return NextResponse.json({ message: "Couldn't update contact details." }, { status: 500 });
    }

    const { error: detailsError } = await admin
      .from("campaigns")
      .update({
        name: details.name,
        description: details.description,
        destination_url: details.destination_url,
        image_url: details.image_urls[0],
        image_urls: details.image_urls,
        pricing_model: details.pricing_model,
        maker_name: details.maker_name,
        x_handle: details.x_handle,
        category: details.category,
      })
      .eq("id", id);

    if (detailsError) {
      console.error("admin campaign details update failed", detailsError);
      return NextResponse.json({ message: "Couldn't update listing details." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const { error } = await admin
    .from("campaigns")
    .update({ status: statusBody.data.status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }

  // Manually activating a campaign that was still waiting on its $1 listing
  // payment - the recovery path for a webhook that never arrived or failed
  // (wrong secret, wrong URL, etc.) despite Lemon Squeezy actually taking the
  // payment. Reconciles the order row too, so it doesn't sit at 'pending'
  // forever looking like nothing was ever paid, and so a later real delivery
  // of the same webhook is a no-op instead of double-processing anything.
  if (statusBody.data.status === "active") {
    const { data: order } = await admin
      .from("listing_orders")
      .select("id")
      .eq("campaign_id", id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (order) {
      const { error: orderError } = await admin
        .from("listing_orders")
        .update({ payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("id", order.id);
      if (orderError) {
        console.error("admin activate: failed to reconcile listing order", order.id, orderError);
      }
    }
  }

  return NextResponse.json({ success: true });
}
