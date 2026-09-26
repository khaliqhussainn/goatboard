import "server-only";
import PDFDocument from "pdfkit";
import {
  BACKLINK_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  REQUIREMENT_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  submissionProgress,
} from "@/lib/get-listed";
import type { GetListedCampaign, GetListedSubmission } from "@/lib/types";

export type GetListedReportData = Pick<
  GetListedCampaign,
  "id" | "startup_name" | "website_url" | "description" | "submission_target" | "status" | "updated_at"
> & { submissions: GetListedSubmission[] };

export type GetListedReportFormat = "csv" | "pdf";

export function getListedReportFormat(request: Request): GetListedReportFormat | null {
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  return format === "csv" || format === "pdf" ? format : null;
}

export function getListedReportFilename(startupName: string, format: GetListedReportFormat) {
  const slug = startupName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "campaign";
  return `goatboard-${slug}-report.${format}`;
}

export async function createGetListedReportResponse(
  report: GetListedReportData,
  format: GetListedReportFormat,
): Promise<Response> {
  const filename = getListedReportFilename(report.startup_name, format);
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  };

  if (format === "pdf") {
    const pdf = await createGetListedPdf(report);
    return new Response(new Uint8Array(pdf), {
      headers: { ...headers, "Content-Type": "application/pdf" },
    });
  }

  return new Response(`\uFEFF${createGetListedCsv(report)}`, {
    headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
  });
}

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function createGetListedCsv(report: GetListedReportData): string {
  const progress = submissionProgress(report.submissions, report.submission_target);
  const lines = [
    ["GOATBOARD Get Listed - submission report"],
    ["Startup", report.startup_name],
    ["Website", report.website_url],
    ["Campaign status", CAMPAIGN_STATUS_LABELS[report.status]],
    ["Target", report.submission_target],
    ["Submitted", progress.sent],
    ["Under review", progress.under_review],
    ["Approved / live", progress.approved],
    ["Rejected", progress.rejected],
    ["Needs action", progress.needs_action],
    ["Planned", progress.planned],
    ["Last updated", report.updated_at],
    [],
    [
      "Directory",
      "Directory URL",
      "Status",
      "Listing URL",
      "Website requirement",
      "Backlink status",
      "Required backlink URL",
      "Backlink instructions",
      "Badge code",
      "Submitted at",
      "Last checked at",
      "Backlink verified at",
      "Public notes",
    ],
    ...report.submissions.map((submission) => [
      submission.directory_name,
      submission.directory_url,
      SUBMISSION_STATUS_LABELS[submission.status],
      submission.listing_url,
      REQUIREMENT_TYPE_LABELS[submission.requirement_type],
      BACKLINK_STATUS_LABELS[submission.backlink_status],
      submission.backlink_url,
      submission.backlink_instructions,
      submission.badge_code,
      submission.submitted_at,
      submission.last_checked_at,
      submission.backlink_verified_at,
      submission.public_notes,
    ]),
  ];

  return lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

const COLORS = {
  ink: "#111111",
  muted: "#666666",
  line: "#DDDDDD",
  panel: "#F5F5F5",
  approved: "#D8F3DC",
  review: "#FFF0B3",
  action: "#FFD6E7",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function createGetListedPdf(report: GetListedReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, right: 54, bottom: 58, left: 54 },
      bufferPages: true,
      info: {
        Title: `${report.startup_name} - Get Listed report`,
        Author: "GOATBOARD",
        Subject: "Directory submission progress report",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const left = doc.page.margins.left;
    const contentWidth = doc.page.width - left - doc.page.margins.right;

    function ensureSpace(height: number) {
      if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
    }

    function labelValue(label: string, value: string) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.muted).text(label.toUpperCase());
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.ink).text(value || "-");
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.muted).text("GOATBOARD GET LISTED");
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.ink).text(report.startup_name);
    doc.moveDown(0.25);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#2457D6")
      .text(report.website_url, { link: report.website_url, underline: true });
    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text(report.description, {
      lineGap: 2,
    });
    doc.moveDown(1);

    const progress = submissionProgress(report.submissions, report.submission_target);
    const boxGap = 8;
    const boxWidth = (contentWidth - boxGap * 3) / 4;
    const summary = [
      ["Submitted", `${progress.sent}/${progress.target}`, COLORS.panel],
      ["Under review", String(progress.under_review), COLORS.review],
      ["Approved / live", String(progress.approved), COLORS.approved],
      ["Needs action", String(progress.needs_action), COLORS.action],
    ] as const;
    const summaryY = doc.y;
    summary.forEach(([label, value, color], index) => {
      const x = left + index * (boxWidth + boxGap);
      doc.roundedRect(x, summaryY, boxWidth, 54, 7).fill(color);
      doc.font("Helvetica-Bold").fontSize(17).fillColor(COLORS.ink).text(value, x + 10, summaryY + 10, {
        width: boxWidth - 20,
      });
      doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted).text(label, x + 10, summaryY + 34, {
        width: boxWidth - 20,
      });
    });
    doc.x = left;
    doc.y = summaryY + 70;

    labelValue("Campaign status", CAMPAIGN_STATUS_LABELS[report.status]);
    doc.moveDown(0.5);
    labelValue("Last updated", new Date(report.updated_at).toLocaleString("en-US"));
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.ink).text("Directory submissions");
    doc.moveDown(0.6);

    if (report.submissions.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text("No client-visible submissions yet.");
    }

    report.submissions.forEach((submission, index) => {
      ensureSpace(submission.badge_code ? 210 : submission.public_notes ? 145 : 120);
      doc.x = left;
      if (index > 0) doc.moveDown(0.8);
      const headingY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(COLORS.ink)
        .text(submission.directory_name, left, headingY, { width: contentWidth * 0.66 });
      const headingBottomY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(SUBMISSION_STATUS_LABELS[submission.status].toUpperCase(), doc.page.width - 190, headingY + 2, {
          width: 136,
          align: "right",
        });
      doc.x = left;
      doc.y = headingBottomY;
      doc.moveDown(0.35);

      if (submission.directory_url) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#2457D6")
          .text(submission.directory_url, left, doc.y, {
            width: contentWidth,
            link: submission.directory_url,
            underline: true,
          });
      }
      if (submission.listing_url) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#2457D6")
          .text(submission.listing_url, left, doc.y, {
            width: contentWidth,
            link: submission.listing_url,
            underline: true,
          });
      }
      doc.moveDown(0.35);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(
          `${REQUIREMENT_TYPE_LABELS[submission.requirement_type]} - ${BACKLINK_STATUS_LABELS[submission.backlink_status]}`,
          left,
          doc.y,
          { width: contentWidth },
        );
      if (submission.public_notes) {
        doc.moveDown(0.25);
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COLORS.ink)
          .text(submission.public_notes, left, doc.y, { width: contentWidth, lineGap: 2 });
      }
      if (submission.badge_code) {
        doc.moveDown(0.4);
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text("BADGE CODE", left, doc.y, { width: contentWidth });
        doc.moveDown(0.15);
        doc
          .font("Courier")
          .fontSize(7)
          .fillColor(COLORS.ink)
          .text(submission.badge_code, left, doc.y, { width: contentWidth, lineGap: 1 });
      }
      doc.moveDown(0.35);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          `Submitted: ${formatDate(submission.submitted_at)}    Last checked: ${formatDate(submission.last_checked_at)}`,
          left,
          doc.y,
          { width: contentWidth },
        );
      doc.moveDown(0.6);
      doc.moveTo(left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(COLORS.line).lineWidth(0.7).stroke();
    });

    const range = doc.bufferedPageRange();
    for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex++) {
      doc.switchToPage(pageIndex);
      // Footer text sits inside the physical page margin. Temporarily remove
      // PDFKit's bottom flow boundary so writing it cannot append a blank page.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          `GOATBOARD - generated ${new Date().toLocaleDateString("en-US")} - page ${pageIndex + 1} of ${range.count}`,
          left,
          doc.page.height - 35,
          { width: contentWidth, align: "center", lineBreak: false },
        );
      doc.page.margins.bottom = bottomMargin;
    }

    doc.end();
  });
}
