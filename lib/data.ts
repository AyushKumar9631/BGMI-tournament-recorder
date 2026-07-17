import { createBrowserClient } from "@/lib/supabase/client";

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Day {
  id: string;
  tournament_id: string;
  day_number: number;
  label: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  day_id: string;
  match_number: number;
  map_name: string;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  tag: string | null;
  created_at: string;
}

export interface SlotWithTeam {
  id: string;
  match_id: string;
  slot_number: number;
  team_id: string | null;
  is_locked: boolean;
  position: number | null;
  kills: number;
  placement_points: number;
  total_points: number;
  wwcd: boolean;
  team: { id: string; name: string; tag: string | null } | null;
}

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTournamentBySlug(
  slug: string
): Promise<Tournament | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDaysForTournament(
  tournamentId: string
): Promise<Day[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("day_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDayByNumber(
  tournamentId: string,
  dayNumber: number
): Promise<Day | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("day_number", dayNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTeamsForTournament(
  tournamentId: string
): Promise<Team[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMatchesForDay(dayId: string): Promise<Match[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("day_id", dayId)
    .order("match_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMatchByNumber(
  dayId: string,
  matchNumber: number
): Promise<Match | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("day_id", dayId)
    .eq("match_number", matchNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getSlotsForMatch(
  matchId: string
): Promise<SlotWithTeam[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("match_slots")
    .select(
      "id, match_id, slot_number, team_id, is_locked, position, kills, placement_points, total_points, wwcd, team:teams(id, name, tag)"
    )
    .eq("match_id", matchId)
    .order("slot_number", { ascending: true });
  if (error) throw new Error(error.message);

  type TeamJoin = { id: string; name: string; tag: string | null };
  type RawSlotRow = Omit<SlotWithTeam, "team"> & {
    team: TeamJoin | TeamJoin[] | null;
  };

  // Supabase types the joined relation as an array even for a to-one FK;
  // normalize it to a single object (or null) for easier consumption.
  return ((data ?? []) as RawSlotRow[]).map((row) => ({
    ...row,
    team: Array.isArray(row.team) ? row.team[0] ?? null : row.team,
  }));
}
