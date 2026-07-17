export const MAPS = [
  "Erangel",
  "Miramar",
  "Sanhok",
  "Vikendi",
  "Rondo",
  "Livik",
  "Other",
] as const;

export const DEFAULT_SLOT_COUNT = 22;

// Mirrors the `placement_points` CASE expression in
// supabase/migrations/0001_init.sql. Used purely for optimistic UI —
// the DB's generated column is always the source of truth after save.
export const PLACEMENT_POINTS: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};

export function placementPoints(position: number | null): number {
  if (position === null) return 0;
  return PLACEMENT_POINTS[position] ?? 0;
}

export function totalPoints(position: number | null, kills: number): number {
  return placementPoints(position) + (kills || 0);
}

export function isWwcd(position: number | null): boolean {
  return position === 1;
}
