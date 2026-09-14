import { NextResponse } from "next/server";
import { getMyGetListedCampaign } from "@/lib/queries/get-listed";
import { getListedPackage, submissionProgress } from "@/lib/get-listed";

/** Escapes a value for CSV: quote it and double any quotes inside. */
function csvCell(value: string | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/**
 * The final submission report, as CSV.
 *
 * Ownership is enforced by getMyGetListedCampaign, so a campaign id belonging
 * to someone else 404s exactly like one that doesn't exist. Only offered for
 * completed campaigns - a mid-flight report would misrepresent work still in
 * progress as the final outcome.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const detail = await getMyGetListedCampaign(id);
  if (!detail) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
  }

  const { campaign, submissions } = detail;
  if (campaign.status !== "completed") {
    return NextResponse.json(
      { message: "The report is available once the campaign is complete." },
      { status: 409 },
    );
  }

  const pkg = getListedPackage(campaign.package_key);
  const progress = submissionProgress(submissions, campaign.submission_target);

  const lines = [
    ["GOATBOARD Get Listed - submission report"].map(csvCell).join(","),
    ["Startup", campaign.startup_name].map(csvCell).join(","),
    ["Website", campaign.website_url].map(csvCell).join(","),
    ["Package", `${pkg.name} (${pkg.summary})`].map(csvCell).join(","),
    ["Target", String(campaign.submission_target)].map(csvCell).join(","),
    ["Submitted", String(progress.sent)].map(csvCell).join(","),
    ["Accepted", String(progress.accepted)].map(csvCell).join(","),
    ["Rejected", String(progress.rejected)].map(csvCell).join(","),
    ["Pending", String(progress.pending)].map(csvCell).join(","),
    "",
    ["Directory", "Directory URL", "Status", "Listing URL", "Submitted at", "Notes"]
      .map(csvCell)
      .join(","),
    ...submissions.map((s) =>
      [
        s.directory_name,
        s.directory_url,
        s.status,
        s.listing_url,
        s.submitted_at,
        s.notes,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const filename = `goatboard-report-${campaign.id}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
