import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BACKLINK_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  REQUIREMENT_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  submissionProgress,
  type GetListedSubmissionStatus,
} from "@/lib/get-listed";
import { getSharedGetListedReport } from "@/lib/queries/get-listed";

export const metadata: Metadata = {
  title: "Live submission report",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  GetListedSubmissionStatus,
  "yellow" | "blue" | "green" | "pink" | "outline"
> = {
  planned: "outline",
  submitted: "blue",
  under_review: "yellow",
  approved: "green",
  rejected: "pink",
  needs_action: "pink",
  removed: "outline",
};

export default async function SharedGetListedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getSharedGetListedReport(token);
  if (!report) notFound();

  const progress = submissionProgress(report.submissions, report.submission_target);

  return (
    <div className="on-backdrop mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <header className="billboard-surface rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              GOATBOARD Get Listed · live report
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {report.startup_name}
            </h1>
            <a
              href={report.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4"
            >
              {report.website_url} <ExternalLink className="size-3" />
            </a>
          </div>
          <Badge variant="outline">{CAMPAIGN_STATUS_LABELS[report.status]}</Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{report.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated {new Date(report.updated_at).toLocaleString("en-US")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={`/api/get-listed/report/${token}/download?format=pdf`} download>
              <Download /> Download PDF
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/get-listed/report/${token}/download?format=csv`} download>
              <Download /> Download CSV
            </a>
          </Button>
        </div>
      </header>

      <section className="billboard-surface mt-5 rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight">Progress</h2>
          <span className="font-black tabular-nums">
            {progress.sent} / {progress.target} submitted
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["submitted", "under_review", "approved", "needs_action"] as const).map((status) => (
            <div key={status} className="rounded-xl border border-border p-3">
              <div className="text-xl font-black tabular-nums">{progress[status]}</div>
              <div className="text-[11px] text-muted-foreground">
                {SUBMISSION_STATUS_LABELS[status]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-lg font-black tracking-tight">Directory submissions</h2>
        {report.submissions.length === 0 ? (
          <p className="billboard-surface mt-3 rounded-[1.75rem] p-5 text-sm text-muted-foreground">
            No client-visible submissions have been added yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {report.submissions.map((submission) => (
              <article
                key={submission.id}
                className="billboard-surface rounded-[1.5rem] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold">{submission.directory_name}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {submission.directory_url && (
                        <a
                          href={submission.directory_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground underline underline-offset-4"
                        >
                          Directory website
                        </a>
                      )}
                      {submission.listing_url && (
                        <a
                          href={submission.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground underline underline-offset-4"
                        >
                          View listing
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[submission.status]}>
                    {SUBMISSION_STATUS_LABELS[submission.status]}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {REQUIREMENT_TYPE_LABELS[submission.requirement_type]}
                  {submission.requirement_type !== "none"
                    ? ` · ${BACKLINK_STATUS_LABELS[submission.backlink_status]}`
                    : ""}
                </p>
                {submission.public_notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {submission.public_notes}
                  </p>
                )}
                {submission.badge_code && (
                  <div className="mt-3 rounded-xl bg-muted p-3">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide">
                      Badge code to add
                    </p>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-muted-foreground">
                      <code>{submission.badge_code}</code>
                    </pre>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  {submission.submitted_at && (
                    <span>
                      Submitted {new Date(submission.submitted_at).toLocaleDateString("en-US")}
                    </span>
                  )}
                  {submission.last_checked_at && (
                    <span>
                      Checked {new Date(submission.last_checked_at).toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
