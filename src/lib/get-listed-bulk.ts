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
  pending: "planned",
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
  error: string | null;
};

export type BulkSubmissionPreview = {
  line: number;
  directory_name: string;
  directory_url: string;
  listing_url: string;
  status: GetListedSubmissionStatus;
  duplicate: boolean;
  warning: string | null;
};

function normalizeStatus(value: string): GetListedSubmissionStatus | null {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return STATUS_ALIASES[key] ?? null;
}

export function parseBulkSubmissionLines(raw: string): ParsedBulkLine[] {
  return raw
    .split(/\r?\n/)
    .map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(({ value }) => value.length > 0)
    .map(({ value, line }) => {
      const open = value.lastIndexOf("(");
      if (open <= 0 || !value.endsWith(")")) {
        return {
          line,
          listingUrl: "",
          status: null,
          error: "Use: listing URL (status)",
        };
      }

      const listingUrl = value.slice(0, open).trim();
      const rawStatus = value.slice(open + 1, -1);
      if (!isSafeUrl(listingUrl)) {
        return { line, listingUrl, status: null, error: "Invalid http(s) listing URL." };
      }

      const status = normalizeStatus(rawStatus);
      if (!status) {
        return { line, listingUrl, status: null, error: `Unknown status: ${rawStatus.trim()}` };
      }

      return { line, listingUrl: new URL(listingUrl).toString(), status, error: null };
    });
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
