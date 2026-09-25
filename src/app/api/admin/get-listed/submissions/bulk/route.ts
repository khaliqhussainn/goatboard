import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { GET_LISTED_SUBMISSION_STATUSES } from "@/lib/get-listed";
import { isSafeUrl } from "@/lib/validation";

const entrySchema = z.object({
  directory_name: z.string().trim().min(1).max(120),
  directory_url: z.string().refine(isSafeUrl),
  listing_url: z.string().refine(isSafeUrl),
  status: z.enum(GET_LISTED_SUBMISSION_STATUSES),
});

const bodySchema = z.object({
  campaign_id: z.string().uuid(),
  entries: z.array(entrySchema).min(1).max(100),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "The preview contains invalid rows." }, { status: 400 });
  }

  const urls = parsed.data.entries.map((entry) => entry.listing_url);
  if (new Set(urls).size !== urls.length) {
    return NextResponse.json({ message: "Remove duplicate listing URLs first." }, { status: 409 });
  }

  const admin = createAdminClient();
  const [{ data: campaign }, { data: duplicates }] = await Promise.all([
    admin
      .from("get_listed_campaigns")
      .select("id")
      .eq("id", parsed.data.campaign_id)
      .maybeSingle(),
    admin
      .from("get_listed_submissions")
      .select("listing_url")
      .eq("campaign_id", parsed.data.campaign_id)
      .in("listing_url", urls),
  ]);

  if (!campaign) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }
  if (duplicates?.length) {
    return NextResponse.json({ message: "One or more listing URLs already exist." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("get_listed_submissions")
    .insert(
      parsed.data.entries.map((entry) => ({
        campaign_id: parsed.data.campaign_id,
        directory_name: entry.directory_name,
        directory_url: entry.directory_url,
        listing_url: entry.listing_url,
        status: entry.status,
        submitted_at: entry.status === "planned" ? null : now,
      })),
    )
    .select("id");

  if (error || !data) {
    console.error("bulk get_listed submission insert failed", error);
    return NextResponse.json({ message: "Couldn't import the entries." }, { status: 500 });
  }

  return NextResponse.json({ imported: data.length }, { status: 201 });
}
