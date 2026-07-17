import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TEMPORARY DEBUG ROUTE — delete this file once the issue is diagnosed.
// Visit https://<your-app>.vercel.app/api/debug in production to see
// what env vars + Supabase query the deployed server is actually using.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  const mask = (v: string | null) =>
    v ? `${v.slice(0, 8)}...${v.slice(-6)} (len ${v.length})` : null;

  let queryResult: unknown = null;
  let queryError: string | null = null;

  if (url && anonKey) {
    try {
      const supabase = createClient(url, anonKey);
      const { data, error } = await supabase.from("tournaments").select("*");
      if (error) queryError = error.message;
      else queryResult = data;
    } catch (e) {
      queryError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_masked: mask(anonKey),
    },
    liveQuery: {
      result: queryResult,
      error: queryError,
    },
  });
}
