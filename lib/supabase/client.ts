import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-safe Supabase client.
 *
 * Uses the public anon key and is intended for READS ONLY from client
 * components and Server Components. Row Level Security policies on every
 * table allow public SELECT, so this client can never write — writes must
 * go through the server-only client in `lib/supabase/server.ts`, called
 * from API routes or server actions.
 *
 * IMPORTANT: this creates a brand-new client on every call. Do NOT turn
 * this into a module-level singleton (e.g. `const client = createClient(...)`
 * at the top of the file) — a singleton created once at cold-start/build
 * time can end up bound to stale env values or an internal fetch/session
 * state that silently returns empty results on subsequent requests.
 * Always construct fresh, per-call.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check your .env.local file (or Vercel Project Settings > Environment Variables)."
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
}
