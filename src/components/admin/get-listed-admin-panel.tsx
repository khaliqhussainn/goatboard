"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getListedPackage,
  submissionProgress,
  CAMPAIGN_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  GET_LISTED_CAMPAIGN_STATUSES,
  GET_LISTED_SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type GetListedSubmissionStatus,
  type GetListedCampaignStatus,
} from "@/lib/get-listed";
import { formatMoney } from "@/lib/utils";
import type { GetListedCampaign, GetListedOrder, GetListedSubmission } from "@/lib/types";

type Row = {
  campaign: GetListedCampaign;
  order: GetListedOrder | null;
  submissions: GetListedSubmission[];
};

/**
 * Admin fulfilment for Get Listed: record submissions, move them through
 * their statuses, and move the campaign through delivery.
 *
 * Everything a customer sees comes from these rows, so there is deliberately
 * no "set progress to N" control - progress is only ever the submissions that
 * were actually entered here.
 */
export function GetListedAdminPanel({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No Get Listed campaigns yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <CampaignCard key={row.campaign.id} row={row} />
      ))}
    </div>
  );
}

function CampaignCard({ row }: { row: Row }) {
  const router = useRouter();
  const { campaign, order, submissions } = row;
  const pkg = getListedPackage(campaign.package_key);
  const progress = submissionProgress(submissions, campaign.submission_target);
  const paymentStatus = order?.payment_status ?? "pending";

  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");

  async function addSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/get-listed/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          directory_name: name.trim(),
          directory_url: url.trim() || null,
          status: "submitted",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't add submission.");
        return;
      }
      setName("");
      setUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchSubmission(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/get-listed/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error("Update failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteSubmission(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/get-listed/submissions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Delete failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setCampaignStatus(status: GetListedCampaignStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/get-listed/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Couldn't change status.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{campaign.startup_name}</h3>
            <Badge variant={paymentStatus === "paid" ? "green" : "yellow"}>
              {PAYMENT_STATUS_LABELS[paymentStatus]}
            </Badge>
            <Badge variant="outline">{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {pkg.name} · {formatMoney(order ? Number(order.amount) : pkg.priceUsd)} ·{" "}
            <a
              href={campaign.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {campaign.website_url}
            </a>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {campaign.description}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[campaign.x_url, campaign.linkedin_url, campaign.other_url]
              .filter(Boolean)
              .join(" · ") || "No social links"}
          </p>
          {order?.provider_order_id && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Order {order.provider_order_id}
              {order.paid_at ? ` · paid ${new Date(order.paid_at).toLocaleString("en-US")}` : ""}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-black tabular-nums">
            {progress.sent}/{progress.target}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {progress.accepted} accepted · {progress.rejected} rejected
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {GET_LISTED_CAMPAIGN_STATUSES.map((status) => (
          <Button
            key={status}
            size="sm"
            variant="outline"
            disabled={busy || campaign.status === status}
            onClick={() => setCampaignStatus(status)}
          >
            {CAMPAIGN_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      {submissions.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {submissions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {s.directory_name}
              </span>

              <select
                value={s.status}
                disabled={busy}
                onChange={(e) =>
                  patchSubmission(s.id, {
                    status: e.target.value as GetListedSubmissionStatus,
                  })
                }
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
              >
                {GET_LISTED_SUBMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SUBMISSION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              <Input
                defaultValue={s.listing_url ?? ""}
                placeholder="Listing URL"
                disabled={busy}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value !== (s.listing_url ?? "")) {
                    patchSubmission(s.id, { listing_url: value || null });
                  }
                }}
                className="h-8 w-48 text-xs"
              />

              <Input
                defaultValue={s.notes ?? ""}
                placeholder="Notes"
                disabled={busy}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value !== (s.notes ?? "")) {
                    patchSubmission(s.id, { notes: value || null });
                  }
                }}
                className="h-8 w-40 text-xs"
              />

              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                aria-label={`Delete ${s.directory_name}`}
                onClick={() => deleteSubmission(s.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addSubmission} className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Directory name"
          className="h-9 w-48"
          required
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Directory URL (optional)"
          className="h-9 w-56"
        />
        <Button type="submit" size="sm" disabled={busy}>
          Add submission
        </Button>
      </form>
    </div>
  );
}
