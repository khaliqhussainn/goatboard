import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const VISITOR_COOKIE = "goatboard_uid";

/**
 * Thrown when VISITOR_TOKEN_SECRET is missing. Callers catch this and fail
 * closed (no identity handed out, no vote accepted) rather than falling back
 * to an unsigned value - a misconfigured secret must mean "voting is
 * unavailable", never "voting is unverified".
 */
export class VisitorTokenConfigError extends Error {}

function getSecret(): string {
  const secret = process.env.VISITOR_TOKEN_SECRET;
  if (!secret) {
    throw new VisitorTokenConfigError(
      "VISITOR_TOKEN_SECRET is not set - generate one (e.g. `openssl rand -hex 32`) and add it " +
        "to the environment. Without it, no visitor identity can be verified, so voting stays " +
        "disabled rather than accepting unsigned identities.",
    );
  }
  return secret;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Signs a visitor id into a `<uuid>.<hmac>` token. This is what actually goes
 * in the cookie - the server generates the id (crypto.randomUUID in
 * proxy.ts), signs it with a secret the browser never sees, and nothing
 * downstream trusts a cookie value it can't re-verify against this
 * signature. It does not, by itself, stop someone from discarding the
 * cookie and getting a fresh signed identity next request - that's an
 * inherent property of login-free identity, and is why the vote endpoint
 * also rate-limits by IP rather than relying on identity alone.
 */
export function signVisitorId(id: string): string {
  const signature = crypto.createHmac("sha256", getSecret()).update(id).digest("hex");
  return `${id}.${signature}`;
}

/**
 * Verifies a signed visitor token, returning the id only if the signature is
 * genuine. Returns null for anything forged, corrupted, or signed under a
 * different (rotated) secret - never throws for a bad token, only for a
 * missing secret, so a single malformed cookie can't take a route down.
 */
export function verifyVisitorToken(token: string): string | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const id = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!UUID_RE.test(id)) return null;
  // Hex-encoded SHA-256 HMAC is always 64 hex chars; reject anything else
  // before it ever reaches Buffer.from/timingSafeEqual.
  if (!/^[0-9a-f]{64}$/i.test(signature)) return null;

  const expected = crypto.createHmac("sha256", getSecret()).update(id).digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return id;
}

/**
 * Reads the anonymous visitor id assigned by proxy.ts, verifying its
 * signature before trusting it. There is no Supabase Auth in this product -
 * this cookie is the only identity a visitor has, used for daily vote
 * limiting and for "my campaigns" ownership - so an unverifiable or absent
 * cookie means no identity at all (null), not a value to trust as-is.
 * Returns null (fails closed) rather than throwing when the signing secret
 * itself isn't configured, so a missing secret disables voting instead of
 * silently accepting unsigned identities.
 */
export async function getVisitorId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(VISITOR_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyVisitorToken(token);
  } catch (error) {
    if (error instanceof VisitorTokenConfigError) {
      console.error(error.message);
      return null;
    }
    throw error;
  }
}
