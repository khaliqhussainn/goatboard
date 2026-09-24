import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ action: z.enum(["end", "activate"]) });

/**
 * "end" backdates ends_at to now, so the ad simply stops counting as current
 * (see get_current_video_ad), exactly as it would once its real 7 days ran out.
 *
 * "activate" puts this ad in the spot immediately: whatever was playing stops,
 * this one runs for the usual 7 days, and the rest of the queue shifts out
 * behind it. That has to happen inside admin_activate_video_ad rather than as
 * updates from here - video_ads_no_overlap is checked after every statement,
 * so a step-by-step version is rejected the moment the new window touches the
 * one it is replacing.
 */
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

  if (parsed.data.action === "activate") {
    const { data, error } = await admin.rpc("admin_activate_video_ad", { p_id: id });

    if (error) {
      // The function is newer than the rest of video_ads, so a project that
      // hasn't had the latest schema.sql run against it fails here and
      // nowhere else. Worth naming, because "Update failed." sent someone
      // hunting through the wrong code last time.
      if (error.code === "PGRST202") {
        console.error(
          "admin_activate_video_ad is missing - run the latest supabase/schema.sql " +
            `against this project. (${error.message})`,
        );
        return NextResponse.json(
          { message: "Activation isn't set up on this database yet. Run the latest schema.sql." },
          { status: 500 },
        );
      }
      console.error("video ad activation failed", error);
      return NextResponse.json({ message: "Couldn't activate that video." }, { status: 500 });
    }

    return NextResponse.json({ success: true, displacedPaid: data ?? 0 });
  }

  const { error } = await admin
    .from("video_ads")
    .update({ ends_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

/** Deletes a video_ads row outright — for clearing out test rows, not just ending them. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("video_ads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Delete failed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
