import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  getDaysForTournament,
  getTeamsForTournament,
  getTournamentStandings,
} from "@/lib/data";
import AddDayForm from "@/components/AddDayForm";
import AddTeamForm from "@/components/AddTeamForm";
import DayRow from "@/components/DayRow";
import TeamCard from "@/components/TeamCard";
import StandingsTable from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function TournamentDashboard({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) notFound();

  const [days, teams, standings] = await Promise.all([
    getDaysForTournament(tournament.id),
    getTeamsForTournament(tournament.id),
    getTournamentStandings(tournament.id),
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
          <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
            Tournament Standings
          </h2>
          <StandingsTable
            rows={standings}
            emptyMessage="No results yet — standings fill in once matches have scores."
          />
        </section>

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
                <DayRow key={d.id} slug={tournament.slug} day={d} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map((t) => (
                <TeamCard key={t.id} team={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
