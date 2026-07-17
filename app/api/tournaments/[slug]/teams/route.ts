import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const tag =
    typeof body?.tag === "string" && body.tag.trim() ? body.tag.trim() : null;

  if (!name) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id")
    .eq("slug", params.slug)
    .maybeSingle();

  if (tError) {
    return NextResponse.json({ error: tError.message }, { status: 500 });
  }
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({ tournament_id: tournament.id, name, tag })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data }, { status: 201 });
}
