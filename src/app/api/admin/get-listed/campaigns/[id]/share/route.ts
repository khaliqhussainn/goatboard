import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createReportShareToken, hashReportShareToken } from "@/lib/get-listed-share";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/utils";

const bodySchema = z.object({
  expires_at: z.iso.datetime().nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid expiry date." }, { status: 400 });
  }

  const expiresAt = parsed.data.expires_at ?? null;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return NextResponse.json({ message: "Expiry must be in the future." }, { status: 400 });
  }

  const { id } = await params;
  const token = createReportShareToken();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("get_listed_campaigns")
    .update({
      report_share_token_hash: hashReportShareToken(token),
      report_share_enabled: true,
      report_share_created_at: new Date().toISOString(),
      report_share_expires_at: expiresAt,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("get_listed share link creation failed", error);
    return NextResponse.json({ message: "Couldn't create the share link." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const siteUrl = getSiteUrl(new URL(request.url).origin);
  return NextResponse.json({ url: `${siteUrl}/get-listed/report/${token}`, expires_at: expiresAt });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("get_listed_campaigns")
    .update({
      report_share_token_hash: null,
      report_share_enabled: false,
      report_share_created_at: null,
      report_share_expires_at: null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("get_listed share link revocation failed", error);
    return NextResponse.json({ message: "Couldn't revoke the share link." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
