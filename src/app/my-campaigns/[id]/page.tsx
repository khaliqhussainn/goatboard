import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyGetListedCampaign } from "@/lib/queries/get-listed";
import {
  getListedPackage,
  submissionProgress,
  CAMPAIGN_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBMISSION_STATUS_LABELS,
  type GetListedSubmissionStatus,
} from "@/lib/get-listed";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Campaign",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SUBMISSION_VARIANT: Record<GetListedSubmissionStatus, "yellow" | "blue" | "green" | "pink"> = {
  pending: "yellow",
  submitted: "blue",
  accepted: "green",
  rejected: "pink",
};

export default async function GetListedCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Returns null for "doesn't exist" and "not yours" alike, so changing the
  // id in the URL can't tell the two apart.
  const detail = await getMyGetListedCampaign(id);
  if (!detail) notFound();

  const { campaign, order, submissions } = detail;
  const pkg = getListedPackage(campaign.package_key);
  const progress = submissionProgress(submissions, campaign.submission_target);
  const paymentStatus = order?.payment_status ?? "pending";
  const isComplete = campaign.status === "completed";

  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <Link
        href="/my-campaigns"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to my campaigns
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {campaign.startup_name}
          </h1>
          <a
            href={campaign.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4"
          >
            {campaign.website_url} <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Badge variant={paymentStatus === "paid" ? "green" : "yellow"}>
            {PAYMENT_STATUS_LABELS[paymentStatus]}
          </Badge>
          <Badge variant="outline">{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
        </div>
      </header>

      {paymentStatus !== "paid" && (
        <div className="billboard-surface mt-5 flex flex-col items-start gap-2 rounded-[1.75rem] p-5">
          <p className="text-sm font-semibold">This campaign hasn&apos;t been paid for yet.</p>
          <p className="text-sm text-muted-foreground">
            Work starts once payment is confirmed by our payment provider. If you already paid and
            this still says pending, give it a minute and refresh.
          </p>
          <form action={`/get-listed/start?package=${campaign.package_key}`}>
            <Button variant="abstract">Complete payment</Button>
          </form>
        </div>
      )}

      {/* Order */}
      <section className="mt-6">
        <h2 className="text-lg font-black tracking-tight">Order</h2>
        <dl className="billboard-surface mt-3 flex flex-col gap-2 rounded-[1.75rem] p-5 text-sm">
          <Row label="Package" value={`${pkg.name} - ${pkg.summary}`} />
          <Row label="Price" value={formatMoney(order ? Number(order.amount) : pkg.priceUsd)} />
          <Row label="Payment status" value={PAYMENT_STATUS_LABELS[paymentStatus]} />
          {order?.paid_at && (
            <Row label="Paid" value={new Date(order.paid_at).toLocaleString("en-US")} />
          )}
          <Row label="Created" value={new Date(campaign.created_at).toLocaleString("en-US")} />
        </dl>
      </section>

      {/* Progress */}
      <section className="mt-6">
        <h2 className="text-lg font-black tracking-tight">Progress</h2>
        <div className="billboard-surface mt-3 flex flex-col gap-3 rounded-[1.75rem] p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Submissions sent</span>
            <span className="font-black tabular-nums">
              {progress.sent} / {progress.target}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["pending", "submitted", "accepted", "rejected"] as const).map((status) => (
              <div key={status} className="rounded-xl border border-border p-3">
                <div className="text-xl font-black tabular-nums">{progress[status]}</div>
                <div className="text-[11px] text-muted-foreground">
                  {SUBMISSION_STATUS_LABELS[status]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Submissions */}
      <section className="mt-6">
        <h2 className="text-lg font-black tracking-tight">Submissions</h2>
        {submissions.length === 0 ? (
          <p className="billboard-surface mt-3 rounded-[1.75rem] p-5 text-sm text-muted-foreground">
            {paymentStatus === "paid"
              ? "No submissions recorded yet. They'll appear here as we work through your campaign."
              : "Submissions appear here once your campaign is paid for and we start work."}
          </p>
        ) : (
          <ul className="billboard-surface mt-3 flex flex-col divide-y divide-border rounded-[1.75rem] p-5">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.directory_name}</p>
                  {s.listing_url && (
                    <a
                      href={s.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
                    >
                      View listing <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <Badge variant={SUBMISSION_VARIANT[s.status]}>
                  {SUBMISSION_STATUS_LABELS[s.status]}
                </Badge>
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-US") : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Final report — only offered once the work is actually finished. */}
      <section className="mt-6">
        <h2 className="text-lg font-black tracking-tight">Final report</h2>
        <div className="billboard-surface mt-3 flex flex-col items-start gap-3 rounded-[1.75rem] p-5">
          {isComplete ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your campaign is complete. The report lists every submission and its outcome.
              </p>
              <a href={`/api/get-listed/campaigns/${campaign.id}/report`} download>
                <Button variant="abstract">Download report (CSV)</Button>
              </a>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              The final report becomes available when your campaign is marked complete.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words font-semibold">{value}</dd>
    </div>
  );
}
