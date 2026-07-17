import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await req.json().catch(() => ({}));
  const label =
    typeof body?.label === "string" && body.label.trim()
      ? body.label.trim()
      : null;

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

  const { data: lastDay, error: lastError } = await supabase
    .from("days")
    .select("day_number")
    .eq("tournament_id", tournament.id)
    .order("day_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    return NextResponse.json({ error: lastError.message }, { status: 500 });
  }

  const nextDayNumber = (lastDay?.day_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("days")
    .insert({
      tournament_id: tournament.id,
      day_number: nextDayNumber,
      label,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ day: data }, { status: 201 });
}
