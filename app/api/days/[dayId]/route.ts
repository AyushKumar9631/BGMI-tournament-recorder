import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !("label" in body)) {
    return NextResponse.json(
      { error: "Nothing to update — only 'label' can be changed." },
      { status: 400 }
    );
  }

  // day_number is intentionally never editable here — it drives ordering
  // and URLs (/t/[slug]/day/[dayNumber]), and the table's unique
  // (tournament_id, day_number) constraint means a free-text renumber
  // could collide with another day. Delete + re-add if you need to
  // resequence days.
  const label =
    typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("days")
    .update({ label })
    .eq("id", params.dayId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ day: data }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  const supabase = createServiceRoleClient();

  // matches.day_id -> days(id) is ON DELETE CASCADE, and match_slots.match_id
  // -> matches(id) is also ON DELETE CASCADE, so this removes every match
  // and every slot/score under this day. The UI's ConfirmButton message
  // states this cascade explicitly before calling here.
  const { error } = await supabase.from("days").delete().eq("id", params.dayId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
