import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  const body = await req.json().catch(() => null);
  const mapName = typeof body?.mapName === "string" ? body.mapName.trim() : "";

  if (!mapName) {
    return NextResponse.json({ error: "Map name is required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: lastMatch, error: lastError } = await supabase
    .from("matches")
    .select("match_number")
    .eq("day_id", params.dayId)
    .order("match_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    return NextResponse.json({ error: lastError.message }, { status: 500 });
  }

  const nextMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("matches")
    .insert({
      day_id: params.dayId,
      match_number: nextMatchNumber,
      map_name: mapName,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ match: data }, { status: 201 });
}
