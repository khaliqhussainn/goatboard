import "server-only";
import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";
import { isSafeUrl } from "@/lib/validation";
import type { GetListedSubmissionStatus } from "@/lib/get-listed";

const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (compatible; GOATBOARDBot/1.0; +https://goatboard.app)";

const STATUS_ALIASES: Record<string, GetListedSubmissionStatus> = {
  planned: "planned",
  submitted: "submitted",
  under_review: "under_review",
  pending_review: "under_review",
  in_review: "under_review",
  approved: "approved",
  approved_live: "approved",
  live: "approved",
  accepted: "approved",
  rejected: "rejected",
  needs_action: "needs_action",
  action_required: "needs_action",
  removed: "removed",
  expired: "removed",
  removed_expired: "removed",
};

export type ParsedBulkLine = {
  line: number;
  listingUrl: string;
  status: GetListedSubmissionStatus | null;
  publicNotes: string | null;
  badgeCode: string | null;
  error: string | null;
};

export type BulkSubmissionPreview = {
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

function normalizeStatus(value: string): GetListedSubmissionStatus | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const exact = STATUS_ALIASES[normalized];
  if (exact) return exact;

  const words = value.trim().toLowerCase();
  // Order matters: "not listed" and "already listed, pending" must be
  // classified before their shorter component words.
  if (words.includes("not listed")) return "planned";
  if (words.includes("add badge")) return "needs_action";
  if (
    words.includes("verify") ||
    words.includes("permission") ||
    words.includes("email confirmation") ||
    words.includes("action required")
  ) return "needs_action";
  if (words.includes("already listed") || words === "listed" || words.includes("approved")) {
    return "approved";
  }
  if (words.includes("rejected")) return "rejected";
  if (words.includes("under review") || words.includes("pending")) return "under_review";
  if (words.includes("queued") || words.includes("submitted")) return "submitted";
  if (words.includes("removed") || words.includes("expired")) return "removed";
  return null;
}

function cleanMarkdownUrl(value: string): string {
  return value.trim().replace(/\\([&_@])/g, "$1").replace(/&amp;/g, "&");
}

function cleanBadgeCode(value: string): string {
  return value
    .replace(/&#x20;/gi, " ")
    .replace(
      /\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      (_match, _label: string, target: string) =>
        target.trim().replace(/\\([&_@])/g, "$1"),
    )
    .replace(/\\([<>"'_@&])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

type RawRecord = { line: number; url: string; statusText: string; trailing: string[] };

function parseHeader(value: string, line: number): RawRecord | null {
  const markdownWithStatus = value.match(
    /^\[[^\]]+\]\((https?:\/\/.+)\)\s+\(([^)]*)\)\s*(.*)$/,
  );
  if (markdownWithStatus) {
    return {
      line,
      url: cleanMarkdownUrl(markdownWithStatus[1]),
      statusText: markdownWithStatus[2].trim(),
      trailing: markdownWithStatus[3].trim() ? [markdownWithStatus[3]] : [],
    };
  }

  const markdownOnly = value.match(/^\[[^\]]+\]\((https?:\/\/.+)\)\s*$/);
  if (markdownOnly) {
    return { line, url: cleanMarkdownUrl(markdownOnly[1]), statusText: "", trailing: [] };
  }

  const plainWithStatus = value.match(/^(https?:\/\/\S+)\s+\(([^)]*)\)\s*(.*)$/);
  if (plainWithStatus) {
    return {
      line,
      url: cleanMarkdownUrl(plainWithStatus[1]),
      statusText: plainWithStatus[2].trim(),
      trailing: plainWithStatus[3].trim() ? [plainWithStatus[3]] : [],
    };
  }

  const plainOnly = value.match(/^(https?:\/\/\S+)\s*$/);
  return plainOnly
    ? { line, url: cleanMarkdownUrl(plainOnly[1]), statusText: "", trailing: [] }
    : null;
}

export function parseBulkSubmissionLines(raw: string): ParsedBulkLine[] {
  const records: RawRecord[] = [];
  const errors: ParsedBulkLine[] = [];
  let current: RawRecord | null = null;

  raw.split(/\r?\n/).forEach((lineValue, index) => {
    const trimmed = lineValue.trim();
    if (!trimmed) return;
    const header = parseHeader(trimmed, index + 1);
    if (header) {
      if (current) records.push(current);
      current = header;
      return;
    }
    if (current) {
      current.trailing.push(lineValue);
    } else {
      errors.push({
        line: index + 1,
        listingUrl: "",
        status: null,
        publicNotes: null,
        badgeCode: null,
        error: "Could not find a listing URL at the start of this entry.",
      });
    }
  });
  if (current) records.push(current);

  return [
    ...records.map((record): ParsedBulkLine => {
      if (!isSafeUrl(record.url)) {
        return {
          line: record.line,
          listingUrl: record.url,
          status: null,
          publicNotes: record.statusText || null,
          badgeCode: null,
          error: "Invalid http(s) listing URL.",
        };
      }

      const trailing = cleanBadgeCode(record.trailing.join("\n"));
      const hasBadge = /add badge/i.test(record.statusText) || /<a\b|<img\b/i.test(trailing);
      const extraNote = !hasBadge && trailing ? trailing : null;
      return {
        line: record.line,
        listingUrl: new URL(record.url).toString(),
        status: normalizeStatus(record.statusText),
        publicNotes: [record.statusText || null, extraNote].filter(Boolean).join(" · ") || null,
        badgeCode: hasBadge && trailing ? trailing : null,
        error: null,
      };
    }),
    ...errors,
  ].sort((a, b) => a.line - b.line);
}

function hostnameName(hostname: string): string {
  const withoutWww = hostname.replace(/^www\./i, "");
  const first = withoutWww.split(".")[0] || withoutWww;
  return first
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || withoutWww;
}

async function readLimitedHtml(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > MAX_HTML_BYTES) throw new Error("Page is too large.");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error("Page is too large.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function fetchDirectoryDetails(listingUrl: string): Promise<{
  directoryName: string;
  directoryUrl: string;
  warning: string | null;
}> {
  const original = new URL(listingUrl);
  let finalUrl = original;

  try {
    const response = await safeFetch(listingUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    finalUrl = new URL(response.url || listingUrl);

    if (!response.ok) throw new Error(`Page returned ${response.status}.`);
    if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
      throw new Error("Page did not return HTML.");
    }

    const $ = cheerio.load(await readLimitedHtml(response));
    const metadataName =
      $('meta[property="og:site_name"]').attr("content")?.trim() ||
      $('meta[name="application-name"]').attr("content")?.trim() ||
      null;

    return {
      directoryName: (metadataName || hostnameName(finalUrl.hostname)).slice(0, 120),
      directoryUrl: finalUrl.origin,
      warning: metadataName ? null : "No site-name metadata; used the hostname.",
    };
  } catch {
    return {
      directoryName: hostnameName(original.hostname).slice(0, 120),
      directoryUrl: original.origin,
      warning: "The page could not be fetched; used the hostname.",
    };
  }
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );
  return results;
}
