import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const body = await req.json().catch(() => null);
  const mapName = typeof body?.mapName === "string" ? body.mapName.trim() : "";

  if (!mapName) {
    return NextResponse.json({ error: "Map name is required." }, { status: 400 });
  }

  // match_number is intentionally never editable here, same reasoning as
  // day_number on the days route — it drives ordering, URLs, and the
  // unique (day_id, match_number) constraint.
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("matches")
    .update({ map_name: mapName })
    .eq("id", params.matchId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ match: data }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const supabase = createServiceRoleClient();

  // match_slots.match_id -> matches(id) is ON DELETE CASCADE, so this
  // removes every slot/score for the match along with it. The UI's
  // ConfirmButton message states this cascade explicitly before calling
  // here.
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", params.matchId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
