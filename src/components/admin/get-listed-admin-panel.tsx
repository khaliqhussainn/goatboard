"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getListedPackage,
  submissionProgress,
  CAMPAIGN_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  GET_LISTED_CAMPAIGN_STATUSES,
  GET_LISTED_SUBMISSION_STATUSES,
  GET_LISTED_REQUIREMENT_TYPES,
  GET_LISTED_BACKLINK_STATUSES,
  SUBMISSION_STATUS_LABELS,
  REQUIREMENT_TYPE_LABELS,
  BACKLINK_STATUS_LABELS,
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
          status: "planned",
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
            {progress.approved} approved · {progress.under_review} under review
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
        <div className="mt-4 flex flex-col gap-3">
          {submissions.map((s) => (
            <SubmissionEditor
              key={s.id}
              submission={s}
              busy={busy}
              onSave={(body) => patchSubmission(s.id, body)}
              onDelete={() => deleteSubmission(s.id)}
            />
          ))}
        </div>
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

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoFromForm(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value) return null;
  return new Date(value).toISOString();
}

function textFromForm(data: FormData, name: string): string | null {
  const value = data.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function SubmissionEditor({
  submission,
  busy,
  onSave,
  onDelete,
}: {
  submission: GetListedSubmission;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await onSave({
      directory_name: textFromForm(data, "directory_name"),
      directory_url: textFromForm(data, "directory_url"),
      status: data.get("status") as GetListedSubmissionStatus,
      listing_url: textFromForm(data, "listing_url"),
      requirement_type: data.get("requirement_type"),
      backlink_status: data.get("backlink_status"),
      backlink_instructions: textFromForm(data, "backlink_instructions"),
      backlink_url: textFromForm(data, "backlink_url"),
      submitted_at: isoFromForm(data.get("submitted_at")),
      last_checked_at: isoFromForm(data.get("last_checked_at")),
      backlink_verified_at: isoFromForm(data.get("backlink_verified_at")),
      public_notes: textFromForm(data, "public_notes"),
      internal_notes: textFromForm(data, "internal_notes"),
      visible_to_client: data.get("visible_to_client") === "on",
    });
  }

  return (
    <details className="rounded-xl border border-border bg-muted/20">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {submission.directory_name}
        </span>
        {!submission.visible_to_client && <Badge variant="outline">Hidden</Badge>}
        <Badge variant="outline">{SUBMISSION_STATUS_LABELS[submission.status]}</Badge>
      </summary>

      <form onSubmit={save} className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
        <Field label="Directory name">
          <Input
            name="directory_name"
            defaultValue={submission.directory_name}
            disabled={busy}
            required
          />
        </Field>
        <Field label="Directory website">
          <Input
            name="directory_url"
            type="url"
            defaultValue={submission.directory_url ?? ""}
            placeholder="https://directory.example"
            disabled={busy}
          />
        </Field>
        <Field label="Submission status">
          <select
            name="status"
            defaultValue={submission.status}
            disabled={busy}
            className="form-field h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm"
          >
            {GET_LISTED_SUBMISSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SUBMISSION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Live listing URL">
          <Input
            name="listing_url"
            type="url"
            defaultValue={submission.listing_url ?? ""}
            placeholder="https://directory.example/product"
            disabled={busy}
          />
        </Field>
        <Field label="Website requirement">
          <select
            name="requirement_type"
            defaultValue={submission.requirement_type}
            disabled={busy}
            className="form-field h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm"
          >
            {GET_LISTED_REQUIREMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {REQUIREMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Backlink / badge status">
          <select
            name="backlink_status"
            defaultValue={submission.backlink_status}
            disabled={busy}
            className="form-field h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm"
          >
            {GET_LISTED_BACKLINK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {BACKLINK_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Required backlink URL">
          <Input
            name="backlink_url"
            type="url"
            defaultValue={submission.backlink_url ?? ""}
            disabled={busy}
          />
        </Field>
        <Field label="Backlink instructions">
          <Textarea
            name="backlink_instructions"
            defaultValue={submission.backlink_instructions ?? ""}
            disabled={busy}
            className="min-h-20"
          />
        </Field>
        <Field label="Submitted at">
          <Input
            name="submitted_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(submission.submitted_at)}
            disabled={busy}
          />
        </Field>
        <Field label="Last checked at">
          <Input
            name="last_checked_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(submission.last_checked_at)}
            disabled={busy}
          />
        </Field>
        <Field label="Backlink verified at">
          <Input
            name="backlink_verified_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(submission.backlink_verified_at)}
            disabled={busy}
          />
        </Field>
        <label className="flex items-center gap-2 self-end rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold">
          <input
            name="visible_to_client"
            type="checkbox"
            defaultChecked={submission.visible_to_client}
            disabled={busy}
            className="size-4"
          />
          Visible to buyer
        </label>
        <Field label="Public progress note" className="md:col-span-2">
          <Textarea
            name="public_notes"
            defaultValue={submission.public_notes ?? submission.notes ?? ""}
            placeholder="Shown to the buyer in their report"
            disabled={busy}
          />
        </Field>
        <Field label="Private admin note" className="md:col-span-2">
          <Textarea
            name="internal_notes"
            defaultValue={submission.internal_notes ?? ""}
            placeholder="Only visible in admin"
            disabled={busy}
          />
        </Field>

        <div className="flex flex-wrap justify-between gap-2 md:col-span-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onDelete}>
            <Trash2 className="mr-1.5 size-3.5" /> Delete
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            Save entry
          </Button>
        </div>
      </form>
    </details>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Label className={className}>
      <span className="mb-1.5 block">{label}</span>
      {children}
    </Label>
  );
}
