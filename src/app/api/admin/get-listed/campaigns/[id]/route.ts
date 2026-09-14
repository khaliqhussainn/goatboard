import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListedCampaignStatusSchema } from "@/lib/validation";

/**
 * Admin-only: move a campaign through fulfilment.
 *
 * Deliberately the only way a campaign reaches in_progress or completed -
 * payment activates a campaign but never delivers it, so completion is always
 * a person saying the work is done.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = getListedCampaignStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("get_listed_campaigns")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const { error } = await admin
    .from("get_listed_campaigns")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) {
    console.error("get_listed campaign status update failed", error);
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
