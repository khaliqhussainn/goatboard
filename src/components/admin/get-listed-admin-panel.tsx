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

      <BulkSubmissionImport campaignId={campaign.id} onImported={() => router.refresh()} />

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

type BulkPreviewEntry = {
  line: number;
  directory_name: string;
  directory_url: string;
  listing_url: string;
  status: GetListedSubmissionStatus | null;
  public_notes: string | null;
  badge_code: string | null;
  requirement_type: "none" | "badge_embed";
  backlink_status: "not_needed" | "requested";
  duplicate: boolean;
  warning: string | null;
};

type BulkPreviewError = { line: number; message: string };

function BulkSubmissionImport({
  campaignId,
  onImported,
}: {
  campaignId: string;
  onImported: () => void;
}) {
  const [raw, setRaw] = React.useState("");
  const [entries, setEntries] = React.useState<BulkPreviewEntry[]>([]);
  const [errors, setErrors] = React.useState<BulkPreviewError[]>([]);
  const [busy, setBusy] = React.useState(false);

  async function preview() {
    if (!raw.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/get-listed/submissions/bulk-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't preview these entries.");
        return;
      }
      setEntries(data.entries ?? []);
      setErrors(data.errors ?? []);
    } catch {
      toast.error("Couldn't preview these entries.");
    } finally {
      setBusy(false);
    }
  }

  async function importEntries() {
    if (!entries.length || entries.some((entry) => entry.duplicate || !entry.status)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/get-listed/submissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          entries: entries.map((entry) => ({
            directory_name: entry.directory_name,
            directory_url: entry.directory_url,
            listing_url: entry.listing_url,
            status: entry.status,
            public_notes: entry.public_notes,
            badge_code: entry.badge_code,
            requirement_type: entry.requirement_type,
            backlink_status: entry.backlink_status,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't import the entries.");
        return;
      }
      toast.success(`${data.imported} ${data.imported === 1 ? "entry" : "entries"} imported.`);
      setRaw("");
      setEntries([]);
      setErrors([]);
      onImported();
    } catch {
      toast.error("Couldn't import the entries.");
    } finally {
      setBusy(false);
    }
  }

  function updateEntry(index: number, patch: Partial<BulkPreviewEntry>) {
    setEntries((current) =>
      current.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...patch } : entry),
    );
  }

  const blocked =
    errors.length > 0 ||
    entries.some(
      (entry) =>
        entry.duplicate ||
        !entry.status ||
        !entry.directory_name.trim() ||
        !entry.directory_url.trim() ||
        !entry.listing_url.trim(),
    );

  return (
    <details className="mt-4 rounded-xl border border-border bg-muted/20">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold">
        Bulk add from listing URLs
      </summary>
      <div className="border-t border-border p-4">
        <Label htmlFor={`bulk-${campaignId}`}>Raw entries</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste raw Markdown or plain links. Status and multiline badge code are read automatically.
        </p>
        <Textarea
          id={`bulk-${campaignId}`}
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            setEntries([]);
            setErrors([]);
          }}
          placeholder={
            "[https://directory.example/product](https://directory.example/product) (under review)\n[https://another.example/submit](https://another.example/submit) (add badge) <a href=\"https://another.example\">Badge</a>"
          }
          className="mt-2 min-h-32 font-mono text-xs"
          disabled={busy}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={preview} disabled={busy || !raw.trim()}>
            {busy ? "Working…" : "Fetch and preview"}
          </Button>
          {(entries.length > 0 || errors.length > 0) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEntries([]);
                setErrors([]);
              }}
            >
              Clear preview
            </Button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-xl border border-hero-pink/40 bg-hero-pink/10 p-3 text-xs">
            <p className="font-bold">Fix these rows and preview again:</p>
            <ul className="mt-1 list-disc pl-4">
              {errors.map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  Line {error.line}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entries.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {entries.map((entry, index) => (
              <div
                key={entry.line}
                className="grid gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-2"
              >
                <Field label={`Directory name · line ${entry.line}`}>
                  <Input
                    value={entry.directory_name}
                    onChange={(event) => updateEntry(index, { directory_name: event.target.value })}
                    disabled={busy}
                  />
                </Field>
                <Field label="Directory URL">
                  <Input
                    type="url"
                    value={entry.directory_url}
                    onChange={(event) => updateEntry(index, { directory_url: event.target.value })}
                    disabled={busy}
                  />
                </Field>
                <Field label="Listing URL" className="md:col-span-2">
                  <Input
                    type="url"
                    value={entry.listing_url}
                    onChange={(event) =>
                      updateEntry(index, {
                        listing_url: event.target.value,
                        // The save endpoint performs the authoritative duplicate
                        // check for an edited URL.
                        duplicate: false,
                      })
                    }
                    disabled={busy}
                    required
                  />
                </Field>
                <div className="min-w-0 md:col-span-2">
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <select
                      value={entry.status ?? ""}
                      onChange={(event) =>
                        updateEntry(index, {
                          status: (event.target.value || null) as GetListedSubmissionStatus | null,
                        })
                      }
                      className="form-field h-8 rounded-lg border border-border bg-background px-2 text-xs"
                      disabled={busy}
                    >
                      <option value="">Choose status</option>
                      {GET_LISTED_SUBMISSION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {SUBMISSION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    {entry.duplicate && <Badge variant="pink">Duplicate</Badge>}
                    {entry.warning && (
                      <span className="text-xs text-muted-foreground">{entry.warning}</span>
                    )}
                    <button
                      type="button"
                      className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground"
                      onClick={() => setEntries((current) => current.filter((_, i) => i !== index))}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {entry.public_notes && (
                  <Field label="Imported note" className="md:col-span-2">
                    <Textarea
                      value={entry.public_notes}
                      onChange={(event) => updateEntry(index, { public_notes: event.target.value })}
                      className="min-h-16"
                      disabled={busy}
                    />
                  </Field>
                )}
                {entry.badge_code && (
                  <Field label="Badge code" className="md:col-span-2">
                    <Textarea
                      value={entry.badge_code}
                      onChange={(event) => updateEntry(index, { badge_code: event.target.value })}
                      className="min-h-28 font-mono text-xs"
                      disabled={busy}
                    />
                  </Field>
                )}
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Review the autofilled names and URLs before importing.
              </p>
              <Button
                type="button"
                size="sm"
                variant="abstract"
                onClick={importEntries}
                disabled={busy || blocked || entries.length === 0}
              >
                Import {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </details>
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
      badge_code: textFromForm(data, "badge_code"),
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
        <Field label="Badge embed code" className="md:col-span-2">
          <Textarea
            name="badge_code"
            defaultValue={submission.badge_code ?? ""}
            placeholder="HTML badge code the buyer needs to add"
            disabled={busy}
            className="min-h-28 font-mono text-xs"
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
