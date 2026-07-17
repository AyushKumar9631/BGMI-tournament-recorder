import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Tournament name is required." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const base = slugify(name);
  let slug = base;
  let suffix = 1;

  // Try base slug first, then base-2, base-3, ... until one isn't taken.
  while (true) {
    const { data: existing, error: checkError } = await supabase
      .from("tournaments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    if (!existing) break;

    suffix += 1;
    slug = `${base}-${suffix}`;

    if (suffix > 50) {
      return NextResponse.json(
        { error: "Could not generate a unique slug." },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({ name, slug })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tournament: data }, { status: 201 });
}
