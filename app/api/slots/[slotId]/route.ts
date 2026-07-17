import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SlotUpdate = Database["public"]["Tables"]["match_slots"]["Update"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slotId: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const update: SlotUpdate = {};

  if ("team_id" in body) {
    update.team_id = body.team_id === null ? null : String(body.team_id);
  }
  if ("position" in body) {
    update.position =
      body.position === null || body.position === ""
        ? null
        : Math.trunc(Number(body.position));
  }
  if ("kills" in body) {
    const kills = Math.trunc(Number(body.kills));
    update.kills = Number.isFinite(kills) && kills >= 0 ? kills : 0;
  }
  if ("is_locked" in body) {
    update.is_locked = Boolean(body.is_locked);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("match_slots")
    .update(update)
    .eq("id", params.slotId)
    .select(
      "id, match_id, slot_number, team_id, is_locked, position, kills, placement_points, total_points, wwcd, team:teams(id, name, tag)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type TeamJoin = { id: string; name: string; tag: string | null };
  const rawTeam = data.team as TeamJoin | TeamJoin[] | null;
  const team = Array.isArray(rawTeam) ? rawTeam[0] ?? null : rawTeam;

  return NextResponse.json({ slot: { ...data, team } }, { status: 200 });
}
