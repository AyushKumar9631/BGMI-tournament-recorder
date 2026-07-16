import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-safe Supabase client.
 *
 * Uses the public anon key and is intended for READS ONLY from client
 * components. Row Level Security policies on every table allow public
 * SELECT, so this client can never write — writes must go through the
 * server-only client in `lib/supabase/server.ts`, called from API routes
 * or server actions.
 *
 * Safe to import into "use client" components.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check your .env.local file."
    );
  }

  return createClient<Database>(url, anonKey);
}
