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

export interface DayWithMatchCount extends Day {
  match_count: number;
}

export interface MatchWithSlotCount extends Match {
  slot_count: number;
}

export interface TeamWithUsage extends Team {
  slot_count: number;
}

export interface DayStanding {
  day_id: string;
  tournament_id: string;
  team_id: string;
  team_name: string;
  team_tag: string | null;
  total_points: number;
  total_kills: number;
  wwcd_count: number;
}

export interface TournamentStanding {
  tournament_id: string;
  team_id: string;
  team_name: string;
  team_tag: string | null;
  total_points: number;
  total_kills: number;
  wwcd_count: number;
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
  if (error) throw new Error(`getTournaments: ${error.message}`);
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
  if (error) throw new Error(`getTournamentBySlug: ${error.message}`);
  return data;
}

export async function getDaysForTournament(
  tournamentId: string
): Promise<DayWithMatchCount[]> {
  const supabase = createBrowserClient();
  const { data: days, error } = await supabase
    .from("days")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("day_number", { ascending: true });
  if (error) throw new Error(`getDaysForTournament: ${error.message}`);

  const list = days ?? [];
  if (list.length === 0) return [];

  // Separate query (rather than an embedded `matches(count)` select) to
  // avoid relying on postgrest-js's embedded-count generics, which have
  // been finicky with this project's hand-written Database type.
  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("day_id")
    .in(
      "day_id",
      list.map((d) => d.id)
    );
  if (matchError) {
    throw new Error(`getDaysForTournament (match counts): ${matchError.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of matchRows ?? []) {
    counts.set(row.day_id, (counts.get(row.day_id) ?? 0) + 1);
  }

  return list.map((d) => ({ ...d, match_count: counts.get(d.id) ?? 0 }));
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
  if (error) throw new Error(`getDayByNumber: ${error.message}`);
  return data;
}

export async function getTeamsForTournament(
  tournamentId: string
): Promise<TeamWithUsage[]> {
  const supabase = createBrowserClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name", { ascending: true });
  if (error) throw new Error(`getTeamsForTournament: ${error.message}`);

  const list = teams ?? [];
  if (list.length === 0) return [];

  const { data: slotRows, error: slotError } = await supabase
    .from("match_slots")
    .select("team_id")
    .in(
      "team_id",
      list.map((t) => t.id)
    );
  if (slotError) {
    throw new Error(`getTeamsForTournament (usage counts): ${slotError.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of slotRows ?? []) {
    if (row.team_id) counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }

  return list.map((t) => ({ ...t, slot_count: counts.get(t.id) ?? 0 }));
}

export async function getMatchesForDay(
  dayId: string
): Promise<MatchWithSlotCount[]> {
  const supabase = createBrowserClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("day_id", dayId)
    .order("match_number", { ascending: true });
  if (error) throw new Error(`getMatchesForDay: ${error.message}`);

  const list = matches ?? [];
  if (list.length === 0) return [];

  const { data: slotRows, error: slotError } = await supabase
    .from("match_slots")
    .select("match_id")
    .in(
      "match_id",
      list.map((m) => m.id)
    );
  if (slotError) {
    throw new Error(`getMatchesForDay (slot counts): ${slotError.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of slotRows ?? []) {
    counts.set(row.match_id, (counts.get(row.match_id) ?? 0) + 1);
  }

  return list.map((m) => ({ ...m, slot_count: counts.get(m.id) ?? 0 }));
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
  if (error) throw new Error(`getMatchByNumber: ${error.message}`);
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
  if (error) throw new Error(`getSlotsForMatch: ${error.message}`);

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

// Ranked by total points desc, ties broken by kills desc — matches how the
// reference tournament sheet ranks its Overall Standings tables.
export async function getDayStandings(dayId: string): Promise<DayStanding[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("day_standings")
    .select("*")
    .eq("day_id", dayId)
    .order("total_points", { ascending: false })
    .order("total_kills", { ascending: false });
  if (error) throw new Error(`getDayStandings: ${error.message}`);
  return data ?? [];
}

export async function getTournamentStandings(
  tournamentId: string
): Promise<TournamentStanding[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("tournament_standings")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("total_points", { ascending: false })
    .order("total_kills", { ascending: false });
  if (error) throw new Error(`getTournamentStandings: ${error.message}`);
  return data ?? [];
}
