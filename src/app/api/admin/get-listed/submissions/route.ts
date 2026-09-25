import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListedSubmissionSchema } from "@/lib/validation";

/**
 * Admin-only: records a real submission against a campaign.
 *
 * Submissions are only ever created here, by a person who actually made the
 * submission - nothing in the product generates them, so a campaign's
 * progress can't show work that didn't happen.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = getListedSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("get_listed_campaigns")
    .select("id")
    .eq("id", input.campaign_id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const status = input.status ?? "planned";
  const requirementType = input.requirement_type ?? "none";
  const backlinkStatus = input.backlink_status ?? "not_needed";
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("get_listed_submissions")
    .insert({
      campaign_id: input.campaign_id,
      directory_name: input.directory_name,
      directory_url: input.directory_url || null,
      status,
      listing_url: input.listing_url || null,
      requirement_type: requirementType,
      backlink_status: backlinkStatus,
      backlink_instructions: input.backlink_instructions || null,
      badge_code: input.badge_code || null,
      backlink_url: input.backlink_url || null,
      public_notes: input.public_notes || null,
      internal_notes: input.internal_notes || null,
      visible_to_client: input.visible_to_client ?? true,
      submitted_at: input.submitted_at ?? (status === "planned" ? null : now),
      last_checked_at: input.last_checked_at ?? null,
      backlink_verified_at:
        input.backlink_verified_at ?? (backlinkStatus === "verified" ? now : null),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("get_listed submission insert failed", error);
    return NextResponse.json({ message: "Couldn't add submission." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
