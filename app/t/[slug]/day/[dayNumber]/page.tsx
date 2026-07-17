import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  getDayByNumber,
  getMatchesForDay,
  getDayStandings,
} from "@/lib/data";
import AddMatchForm from "@/components/AddMatchForm";
import MatchRow from "@/components/MatchRow";
import StandingsTable from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

export default async function DayView({
  params,
}: {
  params: { slug: string; dayNumber: string };
}) {
  const dayNumber = Number(params.dayNumber);
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament || !Number.isFinite(dayNumber)) notFound();

  const day = await getDayByNumber(tournament.id, dayNumber);
  if (!day) notFound();

  const [matches, standings] = await Promise.all([
    getMatchesForDay(day.id),
    getDayStandings(day.id),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link
            href={`/t/${tournament.slug}`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            ← {tournament.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Day {day.day_number}
            {day.label ? (
              <span className="text-neutral-400 font-normal"> — {day.label}</span>
            ) : null}
          </h1>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
              Matches
            </h2>
            <AddMatchForm dayId={day.id} />
          </div>

          {matches.length === 0 ? (
            <p className="text-sm text-neutral-500">No matches yet.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow
                  key={m.id}
                  slug={tournament.slug}
                  dayNumber={day.day_number}
                  match={m}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
            Overall Standings — Day {day.day_number}
          </h2>
          <StandingsTable
            rows={standings}
            emptyMessage="No results yet — standings fill in once this day's matches have scores."
          />
        </section>
      </div>
    </main>
  );
}
