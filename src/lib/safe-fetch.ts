import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

/**
 * Fetches user-supplied URLs (e.g. a campaign's destination site, when
 * looking up its logo) without letting the server be used as an SSRF proxy
 * against internal infrastructure. Validates the resolved IP of every hop
 * — including redirects — before requesting it, and follows redirects
 * manually so a malicious/compromised site can't bounce the request to a
 * private address after the first, safe hop passes.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  maxRedirects = 3,
): Promise<Response> {
  let currentUrl = url;

  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicUrl(currentUrl);
    const res = await fetch(currentUrl, { ...init, redirect: "manual" });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects.");
}

async function assertPublicUrl(urlString: string): Promise<void> {
  const url = new URL(urlString);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported protocol.");
  }

  const hostname = url.hostname;

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Blocked host.");
    return;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) throw new Error("Could not resolve host.");
  for (const record of records) {
    if (isPrivateIp(record.address)) throw new Error("Blocked host.");
  }
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7)); // IPv4-mapped
  return false;
}
