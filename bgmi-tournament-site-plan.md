# BGMI Tournament Tracker — Build Plan (4 Sessions)

**Stack:** Next.js 14 (App Router, TypeScript) + Tailwind CSS + Supabase (Postgres) + Vercel
**Auth:** None for now (open editing) — but writes go through Next.js API routes using the Supabase *service role* key server-side, not the anon key client-side. This keeps the DB safe from direct public writes and makes it trivial to bolt on a password/login later without changing the data layer.
**Scope:** Reusable across multiple tournaments (not a single hardcoded event).
**Interface:** One combined edit+view interface for now. (Public read-only view is a later addition — the schema below doesn't block it.)

Each session below is a **self-contained prompt** for a fresh, context-free Claude Code session. Run them in order. After each session, tell Claude Code to commit + push, and to update `PROGRESS.md` in the repo — that file is how the *next* session (which remembers nothing of this conversation) gets its context back. Every prompt below starts by telling it to read that file first.

---

## Data model (reference — Session 1 will create this)

- **tournaments** — top-level event (name, slug)
- **days** — belongs to a tournament (Day 1, Day 2...)
- **matches** — belongs to a day (Match 1–4, each with a map: Erangel/Miramar/Rondo/etc.)
- **teams** — belongs to a tournament (name + short tag, e.g. "REVX", "RSR")
- **match_slots** — one row per team-in-a-match: slot number, team, position, kills, plus computed points

## Points formula (confirmed against your sheet)

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9+ |
|---|---|---|---|---|---|---|---|---|---|
| Points | 10 | 6 | 5 | 4 | 3 | 2 | 1 | 1 | 0 |

`total_points = placement_points + kills` (1 point per kill). `WWCD = true` when position = 1.

This will live as **generated columns** in Postgres so the math is always consistent no matter what touches the row.

---

## SESSION 1 — Project setup, database schema, deploy skeleton

Copy everything in the box below into a fresh Claude Code session, in an empty repo folder.

```
I'm building a BGMI esports tournament tracker web app. Stack: Next.js 14 (App Router, TypeScript), Tailwind CSS, Supabase (Postgres) as the database, deployed on Vercel. This is a fresh project — there is no PROGRESS.md yet, you're creating it.

CONTEXT: A tournament has Days. Each Day has Matches (e.g. Match 1–4, each played on a map like Erangel/Miramar/Rondo). Each Match has Slots — one row per team — with their finishing Position, Kills, and computed Total points. There's also an Overall Standings view that sums a team's points across all matches within a day. This needs to support MULTIPLE tournaments over time, not just one.

TASK — do the following:

1. Scaffold a Next.js 14 project (App Router, TypeScript, Tailwind, ESLint). Initialize git.

2. Set up the Supabase client: I will manually create a Supabase project at supabase.com and give you the Project URL, anon key, and service role key. Create a `.env.local.example` file listing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, and a real `.env.local` (gitignored) once I paste in my actual values — ask me for them if they're not provided.
   Set up two Supabase client helpers: one browser client (anon key, read-only usage) and one server-only client (service role key, used only inside API routes / server actions, NEVER imported into client components).

3. Create this Postgres schema (write it as a SQL migration file in /supabase/migrations/, and also give me the raw SQL to paste into the Supabase SQL editor since I'll run it manually there first):

```sql
create extension if not exists pgcrypto;

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table days (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  day_number int not null,
  label text,
  created_at timestamptz default now(),
  unique(tournament_id, day_number)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  match_number int not null,
  map_name text not null,
  created_at timestamptz default now(),
  unique(day_id, match_number)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  tag text,
  created_at timestamptz default now()
);

create table match_slots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  slot_number int not null,
  team_id uuid references teams(id) on delete set null,
  is_locked boolean default false,
  position int,
  kills int default 0,
  placement_points int generated always as (
    case position
      when 1 then 10 when 2 then 6 when 3 then 5 when 4 then 4
      when 5 then 3 when 6 then 2 when 7 then 1 when 8 then 1
      else 0
    end
  ) stored,
  total_points int generated always as (
    (case position
      when 1 then 10 when 2 then 6 when 3 then 5 when 4 then 4
      when 5 then 3 when 6 then 2 when 7 then 1 when 8 then 1
      else 0
    end) + coalesce(kills,0)
  ) stored,
  wwcd boolean generated always as (coalesce(position,0) = 1) stored,
  created_at timestamptz default now(),
  unique(match_id, slot_number)
);

-- Enable RLS, but allow full public read + write for now (no auth yet).
-- This is intentionally open since we're not using auth in this phase.
alter table tournaments enable row level security;
alter table days enable row level security;
alter table matches enable row level security;
alter table teams enable row level security;
alter table match_slots enable row level security;

create policy "public read" on tournaments for select using (true);
create policy "public read" on days for select using (true);
create policy "public read" on matches for select using (true);
create policy "public read" on teams for select using (true);
create policy "public read" on match_slots for select using (true);
-- Writes happen only through server-side API routes using the service role key,
-- which bypasses RLS — so no public write policies are needed.
```

4. Build a minimal placeholder homepage that just confirms the Supabase connection works (e.g. fetch and display the count of rows in `tournaments`, which will be 0).

5. Push to a new GitHub repo, connect it to Vercel, and get it deployed. Walk me through any manual steps (creating the GitHub repo, connecting Vercel, adding the three env vars in Vercel's project settings) since you can't do those yourself.

6. Create a `PROGRESS.md` in the repo root summarizing: what's built, the schema, the env var names, the deployed URL, and "what Session 2 should do next" (building the CRUD UI for tournaments/days/matches/teams and the match score-entry table). Future sessions will read this file first.

Ask me for the Supabase credentials and GitHub/Vercel access as needed — don't stall on giving instructions for the parts you can't do yourself.
```

---

## SESSION 2 — Core CRUD + the match score table

```
This is a continuation of an existing project — a BGMI tournament tracker (Next.js + Supabase + Vercel). Start by reading PROGRESS.md in the repo root, and skim the schema in /supabase/migrations/, before doing anything else. Do not re-scaffold or recreate what already exists — build on it.

TASK — build the core editing flow:

1. Home page: list existing tournaments (name, slug), with a "Create tournament" form (name + auto-generated slug). Clicking a tournament goes to its dashboard.

2. Tournament dashboard (`/t/[slug]`): list its Days (e.g. "Day 1", "Day 2"), sorted by day_number, with an "Add Day" button (auto-increments day_number, optional label). Also a "Teams" tab/section listing all teams registered for this tournament with an "Add team" form (name + tag). Clicking a day goes to that day's view.

3. Day view (`/t/[slug]/day/[dayNumber]`): list its Matches (e.g. "Match 1 — Erangel"), with an "Add Match" button (auto-increments match_number, prompts for map name — give a dropdown of common BGMI maps: Erangel, Miramar, Sanhok, Vikendi, Rondo, Livik, plus an "Other" free-text option). Clicking a match opens the match score table.

4. Match score table (`/t/[slug]/day/[dayNumber]/match/[matchNumber]`) — this is the core screen, modeled on this reference layout:

   | Slot | Team | Position | Kills | Total | WWCD |
   |---|---|---|---|---|---|

   - Default to a configurable number of slots (default 22, but let me set it per match) as empty rows on first load, auto-created in match_slots.
   - Each row: a searchable team-select dropdown (pulling from that tournament's teams, with an inline "+ create new team" option so I don't have to leave the table), a Position number input, a Kills number input.
   - A slot can be toggled "Locked" (🔒) — meaning no team assigned yet / placeholder — and shows a lock icon instead of inputs when locked.
   - Total points and WWCD are NOT manually editable — display them read-only, computed. Recompute and show live as Position/Kills change, before save (optimistic), and always trust the DB's generated column as source of truth after save.
   - Save each row's edits automatically on blur (debounced), not via one big "Save" button — this is being filled in live during a tournament broadcast, so it needs to feel instant. Show a small saved/saving indicator per row.
   - Sort rows by slot number by default, but let me re-sort the view by Position or Total without changing underlying slot numbers.

5. Use Next.js API routes (or server actions) with the service-role Supabase client for all writes, per the pattern established in Session 1. Client components only ever read via the anon-key client or call these routes — never write directly to Supabase from the browser.

6. Update PROGRESS.md: what's built now, any schema changes, known gaps, and set up "what Session 3 should do next" as: Day Overall Standings + Tournament-wide standings + edit/delete for teams and matches.

Deploy the updated app and confirm it works on the live Vercel URL before finishing.
```

---

## SESSION 3 — Standings aggregation + team management

```
Continuation of the BGMI tournament tracker (Next.js + Supabase + Vercel). Read PROGRESS.md first, and check the current schema and UI — build on what exists, don't rebuild it.

TASK:

1. Create two Postgres views (as a new migration file, plus raw SQL for me to run in Supabase's SQL editor):

```sql
create view day_standings as
select
  d.id as day_id,
  d.tournament_id,
  t.id as team_id,
  t.name as team_name,
  t.tag,
  coalesce(sum(ms.total_points),0) as total_points,
  coalesce(sum(ms.kills),0) as total_kills,
  coalesce(sum(case when ms.wwcd then 1 else 0 end),0) as wwcd_count
from teams t
left join match_slots ms on ms.team_id = t.id
left join matches m on m.id = ms.match_id
left join days d on d.id = m.day_id and d.tournament_id = t.tournament_id
group by d.id, d.tournament_id, t.id, t.name, t.tag;

create view tournament_standings as
select
  t.tournament_id,
  t.id as team_id,
  t.name as team_name,
  t.tag,
  coalesce(sum(ms.total_points),0) as total_points,
  coalesce(sum(ms.kills),0) as total_kills,
  coalesce(sum(case when ms.wwcd then 1 else 0 end),0) as wwcd_count
from teams t
left join match_slots ms on ms.team_id = t.id
group by t.tournament_id, t.id, t.name, t.tag;
```

   (Adjust these if needed to correctly scope day_standings to only that day's matches — verify against the reference data: a team's "Overall Standings" for a day is the SUM of that team's Total across that day's Match 1–4 only, ranked by total points descending, with kills as a tiebreaker.)

2. Add a "Day Overall Standings" table to the Day view (`/t/[slug]/day/[dayNumber]`), below the matches list: rank, team, total points, total kills, WWCD count — sorted by total points desc, ties broken by kills desc. Auto-refresh when scores change (or at minimum, refetch on page load/focus).

3. Add a "Tournament Standings" tab on the tournament dashboard, same shape as above but aggregated across the whole tournament using `tournament_standings`.

4. Team management: on the Teams section of the tournament dashboard, let me edit a team's name/tag, and delete a team (warn me it will null out that team's slot entries rather than deleting match history — confirm this matches the `on delete set null` behavior already in the schema).

5. Add edit/delete for Days and Matches (with confirmation dialogs, since deleting cascades to all their slot data — make that consequence clear in the UI, e.g. "This will delete 4 matches and all their scores.").

6. Update PROGRESS.md with what's built, and set "what Session 4 should do" as: UI/UX polish, responsiveness, validation/empty states, and final production checks.

Deploy and confirm the live Vercel URL reflects all of this before finishing.
```

---

## SESSION 4 — Polish, validation, responsiveness, production readiness

```
Continuation of the BGMI tournament tracker (Next.js + Supabase + Vercel). Read PROGRESS.md first and review the app as it currently stands (all core CRUD + standings should already work) before making changes.

TASK:

1. Responsive/mobile pass: the match score table and standings tables need to be usable on a phone screen (this will likely be checked live during broadcasts on mobile). Use horizontal scroll or a stacked-card layout on small screens rather than squeezing the full table.

2. Empty/loading/error states: every list (tournaments, days, matches, teams, standings) needs a sensible empty state ("No days yet — add one to get started") and a loading skeleton, and every write action needs visible error handling (e.g. failed save shows a retry, not a silent failure).

3. Validation: Position and Kills should reject negative numbers; slot numbers can't collide within a match (already enforced by the DB unique constraint — surface that as a friendly error, not a raw Postgres error); team names shouldn't be creatable as exact duplicates within the same tournament (case-insensitive check).

4. Quality-of-life additions:
   - "Duplicate match" button (clone a match's slot structure — same teams/slots — into a new match, with position/kills reset to blank, for faster data entry match-to-match).
   - Quick map-name presets and a WWCD-highlighted row style (e.g. subtle highlight or trophy icon on the row where wwcd = true) in the match table.
   - CSV export of a day's Overall Standings and the tournament-wide Standings (simple client-side CSV generation from the already-fetched data).

5. Visual pass: consistent typography, spacing, and a color scheme that reads well for an esports/gaming context — check /mnt/skills/public/frontend-design/SKILL.md-equivalent guidance if you have access to a frontend design skill, otherwise use clean, high-contrast, dark-mode-friendly styling suited to a live-scores product (Tailwind is already in the project).

6. Final production checklist:
   - Confirm all env vars are correctly set in Vercel (not just locally).
   - Confirm RLS policies match intent (public read, writes only via service-role server routes).
   - Do a full click-through: create tournament → add day → add match → enter scores for ~5 slots → confirm day standings and tournament standings update correctly → edit/delete a match → confirm cascading behavior.
   - Note in PROGRESS.md that the MVP is feature-complete, and list clearly what's intentionally deferred (admin auth/login, separate public read-only view) as "future work" so a later session can pick those up cleanly.

Deploy and give me the final live Vercel URL.
```

---

## Notes for you between sessions

- After each session finishes, actually check the live Vercel URL before starting the next prompt — it's much easier to catch a problem immediately than to describe it to a context-free session later.
- Keep `PROGRESS.md` as the source of truth. If a session goes off track, you can always paste its contents into the next session manually to re-ground it.
- The two things you explicitly deferred (admin login, separate public view) are easy to add later precisely because writes already go through server-side API routes — Session 5 (whenever you want it) would just add a password/session check in those routes and a read-only route group for spectators.
