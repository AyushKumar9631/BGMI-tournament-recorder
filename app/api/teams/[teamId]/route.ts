import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const update: { name?: string; tag?: string | null } = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Team name cannot be empty." },
        { status: 400 }
      );
    }
    update.name = name;
  }
  if ("tag" in body) {
    update.tag =
      typeof body.tag === "string" && body.tag.trim() ? body.tag.trim() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("teams")
    .update(update)
    .eq("id", params.teamId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const supabase = createServiceRoleClient();

  // match_slots.team_id -> teams(id) is ON DELETE SET NULL, so this only
  // nulls out the team reference on any slots that used this team — it does
  // not delete match history, positions, or kills on those rows.
  const { error } = await supabase.from("teams").delete().eq("id", params.teamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
