import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ status: z.enum(["active", "suspended", "removed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("campaigns")
    .update({ status: parsed.data.status })
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
  if (parsed.data.status === "active") {
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
