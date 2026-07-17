"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmButton from "./ConfirmButton";
import { MAPS } from "@/lib/constants";
import type { MatchWithSlotCount } from "@/lib/data";

export default function MatchRow({
  slug,
  dayNumber,
  match,
}: {
  slug: string;
  dayNumber: number;
  match: MatchWithSlotCount;
}) {
  const router = useRouter();
  const isKnownMap = (MAPS as readonly string[]).includes(match.map_name);
  const [editing, setEditing] = useState(false);
  const [mapChoice, setMapChoice] = useState<string>(
    isKnownMap ? match.map_name : "Other"
  );
  const [customMap, setCustomMap] = useState(isKnownMap ? "" : match.map_name);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const mapName = mapChoice === "Other" ? customMap.trim() : mapChoice;
    if (!mapName || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update match.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/matches/${match.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Failed to delete match.");
    router.refresh();
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/t/${slug}/day/${dayNumber}/match/${match.match_number}`}
          className="min-w-0 flex-1 hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Match {match.match_number}</span>
            <span className="text-sm text-neutral-400">{match.map_name}</span>
          </div>
          <p className="text-xs text-neutral-500">
            {match.slot_count} slot{match.slot_count === 1 ? "" : "s"}
          </p>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <ConfirmButton
            label="Delete"
            confirmingLabel="Delete match"
            message={
              match.slot_count > 0
                ? `Deletes the match and its ${match.slot_count} slot entr${
                    match.slot_count === 1 ? "y" : "ies"
                  }.`
                : "This match has no slots yet."
            }
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <select
            value={mapChoice}
            onChange={(e) => setMapChoice(e.target.value)}
            disabled={submitting}
            className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {MAPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {mapChoice === "Other" && (
            <input
              type="text"
              value={customMap}
              onChange={(e) => setCustomMap(e.target.value)}
              placeholder="Map name"
              disabled={submitting}
              className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
