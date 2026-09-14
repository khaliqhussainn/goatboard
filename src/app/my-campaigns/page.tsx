import type { Metadata } from "next";
import Link from "next/link";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listMyGetListedCampaigns } from "@/lib/queries/get-listed";
import {
  getListedPackage,
  submissionProgress,
  CAMPAIGN_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/get-listed";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Get Listed Campaigns",
  robots: { index: false, follow: false },
};

// Ownership comes from a cookie, so this can never be cached.
export const dynamic = "force-dynamic";

const PAYMENT_VARIANT = {
  pending: "yellow",
  paid: "green",
  failed: "pink",
  refunded: "outline",
  cancelled: "outline",
} as const;

export default async function MyGetListedCampaignsPage() {
  const rows = await listMyGetListedCampaigns();

  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <header className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            My Get Listed campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribution campaigns bought from this browser.
          </p>
        </div>
        <Link href="/get-listed">
          <Button variant="abstract">New campaign</Button>
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="billboard-surface flex flex-col items-start gap-3 rounded-[1.75rem] p-6">
          <p className="text-sm text-muted-foreground">
            No Get Listed campaigns yet. Campaigns are tied to this browser, so if you bought one
            elsewhere or cleared your cookies, it won&apos;t show here.
          </p>
          <Link href="/get-listed">
            <Button variant="abstract">Browse packages</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ campaign, order, submissions }) => {
            const pkg = getListedPackage(campaign.package_key);
            const progress = submissionProgress(submissions, campaign.submission_target);
            const paymentStatus = order?.payment_status ?? "pending";

            return (
              <div
                key={campaign.id}
                className="billboard-surface flex flex-col gap-3 rounded-[1.75rem] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black tracking-tight">
                      {campaign.startup_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {pkg.name} · {pkg.summary} · {formatMoney(pkg.priceUsd)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Badge variant={PAYMENT_VARIANT[paymentStatus]}>
                      {PAYMENT_STATUS_LABELS[paymentStatus]}
                    </Badge>
                    <Badge variant="outline">{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-semibold tabular-nums">
                      {progress.sent} / {progress.target}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(campaign.created_at).toLocaleDateString("en-US")}
                  </span>
                  <Link href={`/my-campaigns/${campaign.id}`}>
                    <Button size="sm" variant="outline">
                      View campaign
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
