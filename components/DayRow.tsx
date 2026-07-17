"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmButton from "./ConfirmButton";
import type { DayWithMatchCount } from "@/lib/data";

export default function DayRow({
  slug,
  day,
}: {
  slug: string;
  day: DayWithMatchCount;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(day.label ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/days/${day.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update day.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/days/${day.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Failed to delete day.");
    router.refresh();
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/t/${slug}/day/${day.day_number}`}
          className="min-w-0 flex-1 hover:opacity-80"
        >
          <p className="font-medium truncate">
            Day {day.day_number}
            {day.label ? (
              <span className="text-neutral-400 font-normal"> — {day.label}</span>
            ) : null}
          </p>
          <p className="text-xs text-neutral-500">
            {day.match_count} match{day.match_count === 1 ? "" : "es"}
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
            confirmingLabel="Delete day"
            message={
              day.match_count > 0
                ? `Deletes ${day.match_count} match${
                    day.match_count === 1 ? "" : "es"
                  } and all their scores.`
                : "This day has no matches yet."
            }
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            autoFocus
            disabled={submitting}
            className="flex-1 min-w-0 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
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
