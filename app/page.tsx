import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getTournamentCount(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const hasEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasEnv) {
    return {
      ok: false,
      error:
        "Supabase env vars are not set yet. Fill in .env.local (see .env.local.example) to connect.",
    };
  }

  try {
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function Home() {
  const result = await getTournamentCount();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          BGMI Tournament Tracker
        </h1>
        <p className="text-neutral-400 text-sm">
          Session 1 setup check — this page confirms the Supabase connection
          is wired up correctly before any real UI gets built in Session 2.
        </p>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          {result.ok ? (
            <>
              <p className="text-sm text-neutral-400 mb-1">
                Connected to Supabase.
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                {result.count}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                row{result.count === 1 ? "" : "s"} in{" "}
                <code className="text-neutral-300">tournaments</code>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-400 mb-2">
                Not connected yet
              </p>
              <p className="text-sm text-neutral-400">{result.error}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
