"use client";

import { useEffect, useRef, useState } from "react";

interface TeamOption {
  id: string;
  name: string;
  tag: string | null;
}

export default function TeamSelect({
  slug,
  teams,
  value,
  disabled,
  onChange,
  onTeamCreated,
}: {
  slug: string;
  teams: TeamOption[];
  value: TeamOption | null;
  disabled?: boolean;
  onChange: (team: TeamOption | null) => void;
  onTeamCreated: (team: TeamOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = teams.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.tag ?? "").toLowerCase().includes(q)
    );
  });

  const exactMatch = teams.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );

  async function handleCreate() {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${slug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create team.");

      onTeamCreated(json.team);
      onChange(json.team);
      setOpen(false);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  if (disabled) {
    return (
      <div className="px-2 py-1 text-sm text-neutral-400">
        {value ? (
          <>
            {value.name}
            {value.tag ? <span className="text-neutral-600"> [{value.tag}]</span> : null}
          </>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-2 py-1 text-sm rounded border border-neutral-800 bg-neutral-900 hover:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {value ? (
          <>
            {value.name}
            {value.tag ? <span className="text-neutral-500"> [{value.tag}]</span> : null}
          </>
        ) : (
          <span className="text-neutral-600">Select team…</span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-56 rounded-md border border-neutral-800 bg-neutral-900 shadow-lg">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create team…"
            className="w-full border-b border-neutral-800 bg-transparent px-2 py-1.5 text-sm placeholder:text-neutral-500 focus:outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800"
              >
                Clear selection
              </button>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-neutral-800"
              >
                {t.name}
                {t.tag ? <span className="text-neutral-500"> [{t.tag}]</span> : null}
              </button>
            ))}
            {filtered.length === 0 && !query && (
              <p className="px-2 py-1.5 text-xs text-neutral-600">No teams yet.</p>
            )}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left px-2 py-1.5 text-sm text-emerald-400 hover:bg-neutral-800 disabled:opacity-50"
              >
                {creating ? "Creating…" : `+ Create "${query.trim()}"`}
              </button>
            )}
          </div>
          {error && <p className="px-2 py-1 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
