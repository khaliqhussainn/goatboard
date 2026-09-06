import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/** Thrown when required Supabase env vars are missing — callers should catch
 * this specifically to surface an actionable message instead of a raw 500. */
export class SupabaseConfigError extends Error {}

/**
 * Service-role client. Bypasses RLS entirely.
 * Only ever import this from trusted server code: webhooks, admin routes, RPC
 * wrappers. Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new SupabaseConfigError(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set the service role " +
        "(or newer 'secret') key from Settings → API in your Supabase project — the anon/" +
        "publishable key alone isn't enough for server-side writes.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
