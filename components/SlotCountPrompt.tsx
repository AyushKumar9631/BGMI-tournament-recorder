"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SLOT_COUNT } from "@/lib/constants";

export default function SlotCountPrompt({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [count, setCount] = useState(DEFAULT_SLOT_COUNT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/matches/${matchId}/slots/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create slots.");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto text-center rounded-lg border border-neutral-800 bg-neutral-900 p-6 space-y-4">
      <p className="text-sm text-neutral-300">
        This match doesn&apos;t have a score table yet. How many slots?
      </p>
      <div className="flex items-center justify-center gap-2">
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-20 text-center rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          disabled={submitting}
        />
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create score table"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
