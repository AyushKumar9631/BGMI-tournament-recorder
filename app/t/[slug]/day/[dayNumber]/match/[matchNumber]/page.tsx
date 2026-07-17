import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  getDayByNumber,
  getMatchByNumber,
  getTeamsForTournament,
  getSlotsForMatch,
} from "@/lib/data";
import SlotCountPrompt from "@/components/SlotCountPrompt";
import MatchScoreTable from "@/components/MatchScoreTable";

export const dynamic = "force-dynamic";

export default async function MatchScoreScreen({
  params,
}: {
  params: { slug: string; dayNumber: string; matchNumber: string };
}) {
  const dayNumber = Number(params.dayNumber);
  const matchNumber = Number(params.matchNumber);

  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament || !Number.isFinite(dayNumber) || !Number.isFinite(matchNumber)) {
    notFound();
  }

  const day = await getDayByNumber(tournament.id, dayNumber);
  if (!day) notFound();

  const match = await getMatchByNumber(day.id, matchNumber);
  if (!match) notFound();

  const [teams, slots] = await Promise.all([
    getTeamsForTournament(tournament.id),
    getSlotsForMatch(match.id),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href={`/t/${tournament.slug}/day/${day.day_number}`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            ← Day {day.day_number}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Match {match.match_number}
            <span className="text-neutral-400 font-normal"> — {match.map_name}</span>
          </h1>
        </div>

        {slots.length === 0 ? (
          <SlotCountPrompt matchId={match.id} />
        ) : (
          <MatchScoreTable
            slug={tournament.slug}
            initialSlots={slots}
            initialTeams={teams}
          />
        )}
      </div>
    </main>
  );
}
