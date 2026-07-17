import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import CreateTournamentForm from "@/components/CreateTournamentForm";

export const dynamic = "force-dynamic";

interface Tournament {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default async function Home() {
  // --- TEMPORARY DEBUG: bypassing lib/data.ts entirely ---
  // Querying Supabase inline here, same way /api/debug does, to isolate
  // whether the bug is in lib/data.ts / lib/supabase/client.ts.
  let tournaments: Tournament[] = [];
  let debugError: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    if (!url || !anonKey) {
      throw new Error(
        `Missing env vars in page.tsx context. url=${String(url)} anonKeyPresent=${!!anonKey}`
      );
    }
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.from("tournaments").select("*");
    if (error) throw new Error(error.message);
    tournaments = data ?? [];
  } catch (e) {
    debugError = e instanceof Error ? e.stack ?? e.message : String(e);
  }
  // --- END DEBUG ---

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            BGMI Tournament Tracker
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Create a tournament, or open an existing one below.
          </p>
        </div>

        <div className="rounded-md border border-yellow-700 bg-yellow-950/40 p-3 text-xs text-yellow-200 space-y-1">
          <p>DEBUG (inline query, bypassing lib/data.ts): rendered at {new Date().toISOString()}</p>
          <p>DEBUG: tournaments.length = {tournaments.length}</p>
          <p>DEBUG: error = {debugError ?? "none"}</p>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(tournaments, null, 2)}
          </pre>
        </div>

        <CreateTournamentForm />

        <div className="space-y-2">
          {tournaments.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No tournaments yet — create one above to get started.
            </p>
          ) : (
            tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.slug}`}
                className="block rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700 hover:bg-neutral-850 transition-colors"
              >
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-neutral-500">/t/{t.slug}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
