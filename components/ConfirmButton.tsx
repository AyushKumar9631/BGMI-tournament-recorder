"use client";

import { useState } from "react";

/**
 * Inline "are you sure?" control. Clicking `label` swaps the button for a
 * small panel showing `message` (the explicit cascade consequence — e.g.
 * "This deletes 4 matches and all their scores.") plus Confirm/Cancel.
 *
 * Deliberately not a modal — there's no dialog library in this project, and
 * an inline swap fits the rest of the app's lightweight, no-dependency
 * pattern (see AddDayForm/AddMatchForm's open/closed toggle).
 */
export default function ConfirmButton({
  label,
  confirmingLabel = "Confirm",
  message,
  onConfirm,
  className,
}: {
  label: string;
  confirmingLabel?: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      // On success the caller typically triggers router.refresh(), which
      // will unmount/remount this row — but reset local state too in case
      // it doesn't (e.g. the row stays because only sibling data changed).
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className ?? "text-xs text-red-400 hover:text-red-300"}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-900/60 bg-red-950/40 px-2 py-1.5">
        <span className="text-xs text-red-300">{message}</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {busy ? "…" : confirmingLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="text-xs text-neutral-400 hover:text-neutral-200"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
