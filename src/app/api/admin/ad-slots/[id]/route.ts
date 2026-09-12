import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ action: z.literal("end") });

/** Ends a live/scheduled ad slot immediately by backdating ends_at to now — it
 * just stops counting as "current" (see get_current_ad), same as it would
 * once its real duration ran out. */
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
    .from("ad_slots")
    .update({ ends_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

/** Deletes an ad_slots row outright — for clearing out test rows, not just ending them. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("ad_slots").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Delete failed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
