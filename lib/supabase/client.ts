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
 * IMPORTANT — cache bypass:
 * We explicitly pass a custom `fetch` that forces `cache: "no-store"` on
 * every request this client makes. Relying on the route segment's
 * `export const dynamic = "force-dynamic"` to propagate no-store down into
 * fetch calls made *inside* a third-party library (supabase-js) turned out
 * to be unreliable: a request URL that differs only by query string (e.g.
 * adding `.order(...)`, which appends `&order=...` to the REST URL) can get
 * its own separate entry in Vercel's persistent Data Cache the first time
 * it's ever hit — and that cache persists across deployments. If that URL
 * was cached back when a table was empty, it can keep serving that stale
 * empty result indefinitely regardless of later code/config changes.
 * Setting `cache: "no-store"` here removes any ambiguity: this client never
 * reads from or writes to the Next.js/Vercel fetch cache, full stop.
 *
 * Also: this creates a brand-new client on every call — do NOT turn this
 * into a module-level singleton.
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
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
