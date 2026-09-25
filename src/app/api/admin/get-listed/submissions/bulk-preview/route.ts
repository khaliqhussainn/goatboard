import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchDirectoryDetails,
  mapWithConcurrency,
  parseBulkSubmissionLines,
  type BulkSubmissionPreview,
} from "@/lib/get-listed-bulk";

const bodySchema = z.object({
  campaign_id: z.string().uuid(),
  raw: z.string().trim().min(1).max(50_000),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ message: "Enter at least one valid row." }, { status: 400 });
  }

  const parsedLines = parseBulkSubmissionLines(parsedBody.data.raw);
  if (parsedLines.length > 100) {
    return NextResponse.json({ message: "Preview at most 100 rows at a time." }, { status: 400 });
  }

  const lineErrors = parsedLines.filter((line) => line.error);
  const validLines = parsedLines.filter(
    (line): line is typeof line & { status: NonNullable<typeof line.status> } =>
      !line.error && line.status !== null,
  );

  const admin = createAdminClient();
  const [{ data: campaign }, { data: existing }] = await Promise.all([
    admin
      .from("get_listed_campaigns")
      .select("id")
      .eq("id", parsedBody.data.campaign_id)
      .maybeSingle(),
    admin
      .from("get_listed_submissions")
      .select("listing_url")
      .eq("campaign_id", parsedBody.data.campaign_id),
  ]);

  if (!campaign) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const existingUrls = new Set((existing ?? []).flatMap((row) => row.listing_url ? [row.listing_url] : []));
  const inputCounts = new Map<string, number>();
  for (const line of validLines) {
    inputCounts.set(line.listingUrl, (inputCounts.get(line.listingUrl) ?? 0) + 1);
  }

  const entries = await mapWithConcurrency(validLines, 5, async (line) => {
    const details = await fetchDirectoryDetails(line.listingUrl);
    return {
      line: line.line,
      directory_name: details.directoryName,
      directory_url: details.directoryUrl,
      listing_url: line.listingUrl,
      status: line.status,
      duplicate: existingUrls.has(line.listingUrl) || (inputCounts.get(line.listingUrl) ?? 0) > 1,
      warning: details.warning,
    } satisfies BulkSubmissionPreview;
  });

  return NextResponse.json({
    entries,
    errors: lineErrors.map((line) => ({ line: line.line, message: line.error })),
  });
}
