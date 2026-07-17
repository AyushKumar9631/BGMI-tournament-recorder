"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAPS } from "@/lib/constants";

export default function AddMatchForm({ dayId }: { dayId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<string>(MAPS[0]);
  const [customMap, setCustomMap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const mapName = map === "Other" ? customMap.trim() : map;
    if (!mapName) {
      setError("Enter a map name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/days/${dayId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add match.");

      setCustomMap("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm rounded-md border border-neutral-800 px-3 py-1.5 text-neutral-300 hover:border-neutral-700 hover:text-white"
      >
        + Add Match
      </button>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <select
          value={map}
          onChange={(e) => setMap(e.target.value)}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={submitting}
        >
          {MAPS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {map === "Other" && (
          <input
            type="text"
            value={customMap}
            onChange={(e) => setCustomMap(e.target.value)}
            placeholder="Map name"
            autoFocus
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={submitting}
          />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
