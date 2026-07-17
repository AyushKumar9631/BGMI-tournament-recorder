"use client";

import { useRef, useState } from "react";
import TeamSelect from "./TeamSelect";
import { totalPoints, isWwcd } from "@/lib/constants";
import type { SlotData, TeamOption } from "./match-score-types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 600;

export default function SlotRow({
  slot,
  teams,
  slug,
  onTeamCreated,
  onUpdate,
}: {
  slot: SlotData;
  teams: TeamOption[];
  slug: string;
  onTeamCreated: (team: TeamOption) => void;
  onUpdate: (patch: Partial<SlotData>) => void;
}) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function persist(patch: Record<string, unknown>) {
    setStatus("saving");
    try {
      const res = await fetch(`/api/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed.");

      // Sync canonical server state (generated columns are the source of
      // truth) back into the parent's slots array.
      onUpdate({
        team_id: json.slot.team_id,
        team: json.slot.team,
        position: json.slot.position,
        kills: json.slot.kills,
        is_locked: json.slot.is_locked,
        placement_points: json.slot.placement_points,
        total_points: json.slot.total_points,
        wwcd: json.slot.wwcd,
      });

      setStatus("saved");
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(
        () => setStatus((s) => (s === "saved" ? "idle" : s)),
        1500
      );
    } catch {
      setStatus("error");
    }
  }

  function flushSave(patch: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    persist(patch);
  }

  function scheduleSave(patch: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(patch), DEBOUNCE_MS);
  }

  // Recompute total_points/wwcd on the client immediately so the row (and
  // sort order) feels live, ahead of the server round-trip confirming it.
  function optimisticPatch(fields: Partial<SlotData>) {
    const position = "position" in fields ? fields.position! : slot.position;
    const kills = "kills" in fields ? (fields.kills as number) : slot.kills;
    onUpdate({
      ...fields,
      total_points: totalPoints(position, kills),
      wwcd: isWwcd(position),
    });
  }

  function handleTeamChange(t: TeamOption | null) {
    optimisticPatch({ team_id: t?.id ?? null, team: t });
    flushSave({ team_id: t?.id ?? null });
  }

  function handlePositionChange(raw: string) {
    const position = raw === "" ? null : Math.max(1, Math.trunc(Number(raw)) || 1);
    optimisticPatch({ position });
    scheduleSave({ position });
  }
  function handlePositionBlur() {
    flushSave({ position: slot.position });
  }

  function handleKillsChange(raw: string) {
    const kills = Math.max(0, Math.trunc(Number(raw)) || 0);
    optimisticPatch({ kills });
    scheduleSave({ kills });
  }
  function handleKillsBlur() {
    flushSave({ kills: slot.kills });
  }

  function toggleLock() {
    const is_locked = !slot.is_locked;
    optimisticPatch({ is_locked });
    flushSave({ is_locked });
  }

  return (
    <tr className="border-b border-neutral-900 hover:bg-neutral-900/40">
      <td className="px-3 py-2 text-sm text-neutral-500">{slot.slot_number}</td>
      <td className="px-3 py-2">
        <TeamSelect
          slug={slug}
          teams={teams}
          value={slot.team}
          disabled={slot.is_locked}
          onChange={handleTeamChange}
          onTeamCreated={onTeamCreated}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          value={slot.position ?? ""}
          onChange={(e) => handlePositionChange(e.target.value)}
          onBlur={handlePositionBlur}
          disabled={slot.is_locked}
          className="w-16 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          value={slot.kills}
          onChange={(e) => handleKillsChange(e.target.value)}
          onBlur={handleKillsBlur}
          disabled={slot.is_locked}
          className="w-16 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2 text-sm font-medium">{slot.total_points}</td>
      <td className="px-3 py-2 text-sm">{slot.wwcd ? "🏆" : ""}</td>
      <td className="px-3 py-2">
        <button
          onClick={toggleLock}
          className="text-base leading-none"
          title={slot.is_locked ? "Unlock row" : "Lock row"}
        >
          {slot.is_locked ? "🔒" : "🔓"}
        </button>
      </td>
      <td className="px-3 py-2 text-xs w-16">
        {status === "saving" && <span className="text-neutral-500">Saving…</span>}
        {status === "saved" && <span className="text-emerald-500">Saved</span>}
        {status === "error" && <span className="text-red-400">Error</span>}
      </td>
    </tr>
  );
}
