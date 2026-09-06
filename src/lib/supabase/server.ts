import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Plain anon-key Supabase client for Server Components and Route Handlers.
 * There's no Supabase Auth session in this product, so there's no cookie
 * plumbing to do here — this just makes public, RLS-scoped reads.
 */
export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
