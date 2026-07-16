import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only Supabase client.
 *
 * Uses the SECRET service role key, which bypasses Row Level Security
 * entirely. This is what performs every write in the app (inserts,
 * updates, deletes for tournaments/days/matches/teams/match_slots).
 *
 * IMPORTANT: only ever call this from:
 *   - Next.js API routes (app/api/**\/route.ts)
 *   - Server actions ("use server")
 *   - Other server-only modules
 *
 * The `import "server-only"` line above will throw a build error if this
 * file is ever accidentally imported into a client component, as a safety
 * net on top of the naming convention.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Check your .env.local file (or Vercel project env vars in production)."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // No user sessions in this phase — every request is server-to-server.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
