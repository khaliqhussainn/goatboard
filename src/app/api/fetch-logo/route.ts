import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { uploadCampaignImage } from "@/lib/storage";
import { safeFetch } from "@/lib/safe-fetch";
import { getVisitorId } from "@/lib/visitor";
import { isSafeUrl } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({ url: z.string().refine(isSafeUrl, "Invalid URL.") });

const FETCH_TIMEOUT_MS = 6000;
const MAX_ICON_BYTES = 3 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (compatible; GOATBOARDBot/1.0; +https://goatboard.app)";

function timeoutSignal() {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

/** Ranks <link rel="icon"> candidates by their declared size, largest first. */
function sizeRank(sizes: string | undefined): number {
  if (!sizes || sizes === "any") return 0;
  const match = sizes.match(/(\d+)x\d+/i);
  return match ? Number(match[1]) : 0;
}

function collectCandidates($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const candidates: { href: string; rank: number }[] = [];

  $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) candidates.push({ href, rank: 1000 + sizeRank($(el).attr("sizes")) });
  });

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="mask-icon"]').each((_, el) => {
    const href = $(el).attr("href");
    const type = $(el).attr("type") ?? "";
    if (href && !type.includes("svg")) {
      candidates.push({ href, rank: sizeRank($(el).attr("sizes")) });
    }
  });

  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content) candidates.push({ href: content, rank: -1 });
  });

  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const { href } of candidates.sort((a, b) => b.rank - a.rank)) {
    try {
      const abs = new URL(href, baseUrl).toString();
      if (!seen.has(abs)) {
        seen.add(abs);
        resolved.push(abs);
      }
    } catch {
      // ignore unparsable hrefs
    }
  }
  return resolved;
}

async function tryFetchImage(url: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await safeFetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: timeoutSignal(),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!contentType.startsWith("image/")) return null;

    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > MAX_ICON_BYTES) return null;

    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_ICON_BYTES) return null;

    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const limited = rateLimit(`fetch-logo:${visitorId}:${getClientIp(request.headers)}`, {
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid URL." }, { status: 400 });
  }

  let candidates: string[] = [];
  let pageUrl = parsed.data.url;

  try {
    const pageRes = await safeFetch(parsed.data.url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: timeoutSignal(),
    });

    if (pageRes.ok && (pageRes.headers.get("content-type") ?? "").includes("text/html")) {
      pageUrl = pageRes.url || parsed.data.url;
      const html = await pageRes.text();
      const $ = cheerio.load(html);
      candidates = collectCandidates($, pageUrl);
    }
  } catch {
    // The page itself may be unreachable — we still try the favicon.ico fallback below.
  }

  try {
    candidates.push(new URL("/favicon.ico", pageUrl).toString());
  } catch {
    // pageUrl somehow invalid; nothing more we can try.
  }

  for (const candidate of candidates) {
    const image = await tryFetchImage(candidate);
    if (!image) continue;

    try {
      const admin = createAdminClient();
      const url = await uploadCampaignImage(admin, visitorId, image.bytes, image.contentType);
      return NextResponse.json({ url });
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        console.error(error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
      // This candidate's upload failed (e.g. unsupported type after all) — try the next one.
      console.error("logo upload failed", error);
    }
  }

  return NextResponse.json(
    { message: "Couldn't find a logo on that site. Try uploading one instead." },
    { status: 404 },
  );
}
