"use client";

import { useState } from "react";
import SlotRow from "./SlotRow";
import type { SlotData, TeamOption } from "./match-score-types";

type SortKey = "slot" | "position" | "total";

const SORT_LABELS: Record<SortKey, string> = {
  slot: "Slot #",
  position: "Position",
  total: "Total",
};

export default function MatchScoreTable({
  slug,
  initialSlots,
  initialTeams,
}: {
  slug: string;
  initialSlots: SlotData[];
  initialTeams: TeamOption[];
}) {
  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [teams, setTeams] = useState<TeamOption[]>(initialTeams);
  const [sortKey, setSortKey] = useState<SortKey>("slot");

  function handleTeamCreated(team: TeamOption) {
    setTeams((prev) =>
      prev.some((t) => t.id === team.id)
        ? prev
        : [...prev, team].sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  function handleSlotUpdate(id: string, patch: Partial<SlotData>) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  // Sorting only changes display order — slot_number (the underlying
  // identity of each row) never changes.
  const sorted = [...slots].sort((a, b) => {
    if (sortKey === "position") {
      const ap = a.position ?? Number.MAX_SAFE_INTEGER;
      const bp = b.position ?? Number.MAX_SAFE_INTEGER;
      if (ap !== bp) return ap - bp;
      return a.slot_number - b.slot_number;
    }
    if (sortKey === "total") {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return a.slot_number - b.slot_number;
    }
    return a.slot_number - b.slot_number;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-neutral-500">Sort by:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={`px-2 py-1 rounded ${
              sortKey === k
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {SORT_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-800 text-xs uppercase text-neutral-500">
              <th className="px-3 py-2 font-medium">Slot</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Position</th>
              <th className="px-3 py-2 font-medium">Kills</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">WWCD</th>
              <th className="px-3 py-2 font-medium">Lock</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                teams={teams}
                slug={slug}
                onTeamCreated={handleTeamCreated}
                onUpdate={(patch) => handleSlotUpdate(slot.id, patch)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
