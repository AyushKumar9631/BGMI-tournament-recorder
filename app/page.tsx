import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getTournaments } from "@/lib/data";
import CreateTournamentForm from "@/components/CreateTournamentForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // --- TEST A: raw inline client, select * , NO order clause ---
  let resultA: unknown = null;
  let errorA: string | null = null;
  try {
    const sb = createClient(url!, anonKey!);
    const { data, error } = await sb.from("tournaments").select("*");
    if (error) throw new Error(error.message);
    resultA = data;
  } catch (e) {
    errorA = e instanceof Error ? e.message : String(e);
  }

  // --- TEST B: raw inline client, select * , WITH order clause (matches lib/data.ts query shape) ---
  let resultB: unknown = null;
  let errorB: string | null = null;
  try {
    const sb = createClient(url!, anonKey!);
    const { data, error } = await sb
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    resultB = data;
  } catch (e) {
    errorB = e instanceof Error ? e.message : String(e);
  }

  // --- TEST C: through lib/data.ts's getTournaments(), unmodified ---
  let resultC: unknown = null;
  let errorC: string | null = null;
  try {
    resultC = await getTournaments();
  } catch (e) {
    errorC = e instanceof Error ? e.message : String(e);
  }

  const tournaments = Array.isArray(resultC) ? resultC : [];

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

        <div className="rounded-md border border-yellow-700 bg-yellow-950/40 p-3 text-xs text-yellow-200 space-y-3">
          <p>rendered at {new Date().toISOString()}</p>
          <div>
            <p className="font-bold">TEST A (inline, no order):</p>
            <p>error: {errorA ?? "none"}</p>
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(resultA)}</pre>
          </div>
          <div>
            <p className="font-bold">TEST B (inline, WITH order — matches lib/data.ts):</p>
            <p>error: {errorB ?? "none"}</p>
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(resultB)}</pre>
          </div>
          <div>
            <p className="font-bold">TEST C (via lib/data.ts getTournaments()):</p>
            <p>error: {errorC ?? "none"}</p>
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(resultC)}</pre>
          </div>
        </div>

        <CreateTournamentForm />

        <div className="space-y-2">
          {tournaments.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No tournaments yet — create one above to get started.
            </p>
          ) : (
            tournaments.map((t: { id: string; slug: string; name: string }) => (
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
