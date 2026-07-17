"use client";

import { useState } from "react";

interface Team {
  id: string;
  tournament_id: string;
  name: string;
  tag: string | null;
  created_at: string;
}

export default function AddTeamForm({
  slug,
  onCreated,
  compact = false,
}: {
  slug: string;
  onCreated?: (team: Team) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(compact ? true : false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${slug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tag: tag.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add team.");

      setName("");
      setTag("");
      if (!compact) setOpen(false);
      onCreated?.(json.team);
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
        + Add Team
      </button>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          autoFocus
          className="w-40 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={submitting}
        />
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Tag (optional)"
          className="w-24 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
        {!compact && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        )}
      </form>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
