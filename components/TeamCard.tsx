"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmButton from "./ConfirmButton";
import type { TeamWithUsage } from "@/lib/data";

export default function TeamCard({ team }: { team: TeamWithUsage }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tag: tag.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update team.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Failed to delete team.");
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 space-y-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            autoFocus
            disabled={submitting}
            className="min-w-0 flex-1 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag"
            disabled={submitting}
            className="w-20 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(team.name);
              setTag(team.tag ?? "");
              setError(null);
            }}
            disabled={submitting}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
      <div className="min-w-0 truncate">
        <span className="font-medium">{team.name}</span>
        {team.tag ? <span className="text-neutral-500"> [{team.tag}]</span> : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-neutral-400 hover:text-neutral-200"
        >
          Edit
        </button>
        <ConfirmButton
          label="Delete"
          confirmingLabel="Delete team"
          message={
            team.slot_count > 0
              ? `Used in ${team.slot_count} slot${
                  team.slot_count === 1 ? "" : "s"
                } — those will show as unassigned, scores stay.`
              : "This team hasn't played any matches yet."
          }
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
