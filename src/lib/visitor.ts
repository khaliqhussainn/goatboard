import "server-only";
import { cookies } from "next/headers";

export const VISITOR_COOKIE = "goatboard_uid";

/**
 * Reads the anonymous visitor id assigned by middleware.ts. There is no
 * Supabase Auth in this product — this cookie is the only identity a
 * visitor has, used for daily vote limiting and for "my campaigns"
 * ownership. middleware.ts guarantees it's set before any Server Component
 * or route handler runs, so this should never be null in practice; the
 * fallback only matters for requests that somehow bypass middleware.
 */
export async function getVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}
