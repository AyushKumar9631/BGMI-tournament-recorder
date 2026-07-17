export interface StandingsRow {
  team_id: string;
  team_name: string;
  team_tag: string | null;
  total_points: number;
  total_kills: number;
  wwcd_count: number;
}

/**
 * Plain presentational table — no client-side state, safe to render
 * straight from a Server Component. Rows are expected to already be
 * sorted by the caller's query (total_points desc, total_kills desc,
 * matching how the reference tournament sheet ranks Overall Standings).
 */
export default function StandingsTable({
  rows,
  emptyMessage,
}: {
  rows: StandingsRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-neutral-800 text-xs uppercase text-neutral-500">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 font-medium">Points</th>
            <th className="px-3 py-2 font-medium">Kills</th>
            <th className="px-3 py-2 font-medium">WWCD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.team_id}
              className="border-b border-neutral-900 last:border-0 hover:bg-neutral-900/40"
            >
              <td className="px-3 py-2 text-sm text-neutral-500">{i + 1}</td>
              <td className="px-3 py-2 text-sm font-medium">
                {r.team_name}
                {r.team_tag ? (
                  <span className="text-neutral-500 font-normal"> [{r.team_tag}]</span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-sm font-semibold text-emerald-400">
                {r.total_points}
              </td>
              <td className="px-3 py-2 text-sm text-neutral-300">{r.total_kills}</td>
              <td className="px-3 py-2 text-sm text-neutral-300">
                {r.wwcd_count > 0 ? `🏆 ${r.wwcd_count}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
