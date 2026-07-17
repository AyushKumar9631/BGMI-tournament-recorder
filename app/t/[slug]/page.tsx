import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  getDaysForTournament,
  getTeamsForTournament,
} from "@/lib/data";
import AddDayForm from "@/components/AddDayForm";
import AddTeamForm from "@/components/AddTeamForm";

export const dynamic = "force-dynamic";

export default async function TournamentDashboard({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) notFound();

  const [days, teams] = await Promise.all([
    getDaysForTournament(tournament.id),
    getTeamsForTournament(tournament.id),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
            ← All tournaments
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            {tournament.name}
          </h1>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
              Days
            </h2>
            <AddDayForm slug={tournament.slug} />
          </div>

          {days.length === 0 ? (
            <p className="text-sm text-neutral-500">No days yet.</p>
          ) : (
            <div className="space-y-2">
              {days.map((d) => (
                <Link
                  key={d.id}
                  href={`/t/${tournament.slug}/day/${d.day_number}`}
                  className="block rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
                >
                  <p className="font-medium">
                    Day {d.day_number}
                    {d.label ? (
                      <span className="text-neutral-400 font-normal"> — {d.label}</span>
                    ) : null}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
              Teams
            </h2>
            <AddTeamForm slug={tournament.slug} />
          </div>

          {teams.length === 0 ? (
            <p className="text-sm text-neutral-500">No teams yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{t.name}</span>
                  {t.tag ? (
                    <span className="text-neutral-500"> [{t.tag}]</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
