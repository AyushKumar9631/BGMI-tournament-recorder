import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DEFAULT_SLOT_COUNT } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const rawCount = Number(body?.count ?? DEFAULT_SLOT_COUNT);
  const count = Number.isFinite(rawCount)
    ? Math.min(Math.max(Math.trunc(rawCount), 1), 100)
    : DEFAULT_SLOT_COUNT;

  const supabase = createServiceRoleClient();

  // Guard against double-init (e.g. two tabs open): if slots already exist,
  // just return them instead of creating duplicates.
  const { data: existing, error: existingError } = await supabase
    .from("match_slots")
    .select(
      "id, match_id, slot_number, team_id, is_locked, position, kills, placement_points, total_points, wwcd"
    )
    .eq("match_id", params.matchId)
    .order("slot_number", { ascending: true });

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ slots: existing }, { status: 200 });
  }

  const rows = Array.from({ length: count }, (_, i) => ({
    match_id: params.matchId,
    slot_number: i + 1,
  }));

  const { data, error } = await supabase
    .from("match_slots")
    .insert(rows)
    .select(
      "id, match_id, slot_number, team_id, is_locked, position, kills, placement_points, total_points, wwcd"
    )
    .order("slot_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data }, { status: 201 });
}
