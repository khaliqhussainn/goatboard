import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListedSubmissionUpdateSchema } from "@/lib/validation";
import type { GetListedSubmission } from "@/lib/types";

/** Admin-only: edit every operational and buyer-visible submission field. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = getListedSubmissionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("get_listed_submissions")
    .select("id, status, submitted_at")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ message: "Submission not found." }, { status: 404 });
  }

  const update: Partial<GetListedSubmission> = {};
  if (input.directory_name !== undefined) update.directory_name = input.directory_name;
  if (input.directory_url !== undefined) update.directory_url = input.directory_url || null;
  if (input.listing_url !== undefined) update.listing_url = input.listing_url || null;
  if (input.requirement_type !== undefined) update.requirement_type = input.requirement_type;
  if (input.backlink_status !== undefined) update.backlink_status = input.backlink_status;
  if (input.backlink_instructions !== undefined) {
    update.backlink_instructions = input.backlink_instructions || null;
  }
  if (input.badge_code !== undefined) update.badge_code = input.badge_code || null;
  if (input.backlink_url !== undefined) update.backlink_url = input.backlink_url || null;
  if (input.public_notes !== undefined) update.public_notes = input.public_notes || null;
  if (input.internal_notes !== undefined) update.internal_notes = input.internal_notes || null;
  if (input.visible_to_client !== undefined) update.visible_to_client = input.visible_to_client;
  if (input.submitted_at !== undefined) update.submitted_at = input.submitted_at;
  if (input.last_checked_at !== undefined) update.last_checked_at = input.last_checked_at;
  if (input.backlink_verified_at !== undefined) {
    update.backlink_verified_at = input.backlink_verified_at;
  }

  if (input.status !== undefined) {
    update.status = input.status;
    // Stamp the first time it leaves "planned", and keep that original time
    // through any later status change - it's when we submitted, not when the
    // directory last replied.
    if (input.status !== "planned" && !existing.submitted_at && !input.submitted_at) {
      update.submitted_at = new Date().toISOString();
    }
  }

  if (
    input.backlink_status === "verified" &&
    !input.backlink_verified_at
  ) {
    update.backlink_verified_at = new Date().toISOString();
  }

  const { error } = await admin.from("get_listed_submissions").update(update).eq("id", id);

  if (error) {
    console.error("get_listed submission update failed", error);
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** Admin-only: remove a submission added by mistake. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("get_listed_submissions").delete().eq("id", id);

  if (error) {
    console.error("get_listed submission delete failed", error);
    return NextResponse.json({ message: "Delete failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
