import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  getDayByNumber,
  getMatchesForDay,
} from "@/lib/data";
import AddMatchForm from "@/components/AddMatchForm";

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

  const matches = await getMatchesForDay(day.id);

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
                <Link
                  key={m.id}
                  href={`/t/${tournament.slug}/day/${day.day_number}/match/${m.match_number}`}
                  className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
                >
                  <span className="font-medium">Match {m.match_number}</span>
                  <span className="text-sm text-neutral-400">{m.map_name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
