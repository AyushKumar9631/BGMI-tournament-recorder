# PROGRESS.md — BGMI Tournament Tracker

Read this file first before doing anything. It's the only memory a new
session has of what came before.

## Stack

- Next.js **14.2.35** (App Router, TypeScript) — pinned deliberately, do not upgrade to 15/16 without discussing it first
- Tailwind CSS
- Supabase (Postgres) — database + generated columns for scoring math
- Deploy target: Vercel
- No auth yet. Writes go through server-side API routes using the Supabase
  **service role** key, never the anon key from the browser. This is what
  keeps the DB safe without auth, and makes it trivial to add a login later
  without touching the data layer.

## What's built (Session 1)

- Project scaffolded with `create-next-app@14` (TypeScript, Tailwind, ESLint, App Router, no `src/` dir, `@/*` import alias).
- `@supabase/supabase-js` and `server-only` installed.
- Two Supabase client helpers:
  - `lib/supabase/client.ts` — browser client, anon key, read-only usage, safe in client components.
  - `lib/supabase/server.ts` — server-only client, service role key, bypasses RLS, guarded by the `server-only` import so it can't accidentally leak into a client bundle. **All writes go through this.**
  - `lib/supabase/types.ts` — hand-written `Database` type matching the schema below, including the `Relationships`/`Views`/`Functions`/`Enums`/`CompositeTypes` fields that `@supabase/postgrest-js@2.110.x` requires for its generics to resolve correctly (without these, column selects silently infer as `never` and the build fails — learned the hard way in Session 2). Swap for real `supabase gen types` output later if wanted; shape is compatible.
- Full SQL schema written as `supabase/migrations/0001_init.sql`. **Confirmed run against the live Supabase project** — tables and RLS policies exist.
- `.env.local.example` committed (three vars, see below).
- `npm run build` passes clean (typecheck + lint + build all green).
- **Deployed and confirmed live**: pushed to GitHub, connected to Vercel, all three env vars set in Vercel project settings. The Session 1 connection-check homepage confirmed "Connected to Supabase — 0 rows in tournaments" on the live URL before Session 2 began.

## What's built (Session 2)

Full CRUD flow, replacing the Session 1 placeholder homepage:

- **`lib/constants.ts`** — single source of truth for the map list (Erangel/Miramar/Sanhok/Vikendi/Rondo/Livik/Other) and a client-side points table mirroring the DB's generated-column CASE expression, used only for optimistic UI (server generated columns are always the actual source of truth after save).
- **`lib/slug.ts`** — slug generation for tournament names.
- **`lib/data.ts`** — shared read helpers (`getTournaments`, `getTournamentBySlug`, `getDaysForTournament`, `getDayByNumber`, `getTeamsForTournament`, `getMatchesForDay`, `getMatchByNumber`, `getSlotsForMatch`), all using the anon-key browser client since these are reads (RLS allows public select). Service-role client is reserved strictly for writes in API routes.
- **Pages**:
  - `/` — list tournaments + create-tournament form.
  - `/t/[slug]` — tournament dashboard: Days list + "Add Day", Teams list + "Add Team".
  - `/t/[slug]/day/[dayNumber]` — day view: Matches list + "Add Match" (map dropdown, "Other" reveals free-text input).
  - `/t/[slug]/day/[dayNumber]/match/[matchNumber]` — **the core screen**. First open with no `match_slots` rows yet shows `SlotCountPrompt` (default 22, configurable) which bulk-creates empty slots. Once slots exist, renders `MatchScoreTable`.
- **`MatchScoreTable` / `SlotRow` / `TeamSelect`** (in `components/`):
  - Table columns: Slot / Team / Position / Kills / Total / WWCD / Lock / save-status.
  - `TeamSelect` is a searchable combobox per row with inline "+ Create '<query>'" — newly created teams propagate to every row's dropdown immediately (lifted state in `MatchScoreTable`), no page refresh needed.
  - Position/Kills are debounced-autosave (600ms after typing stops) and also flush immediately on blur or on any discrete action (team pick, lock toggle). Each row shows its own Saving…/Saved/Error status.
  - Total/WWCD are computed optimistically client-side the instant you type (via `lib/constants.ts`), then reconciled with the DB's actual generated-column values once the save round-trip completes — so the UI never trusts its own math past that point.
  - Locking a row (🔒) disables its inputs and shows the team as plain text instead of an editable dropdown.
  - Sort control (Slot # / Position / Total) re-orders the *display* only — `slot_number` (each row's real identity) never changes, so re-sorting can't corrupt which row maps to which underlying `match_slots` id.
- **API routes** (all writes go through these, using the service-role client — nothing ever writes from the browser directly):
  - `POST /api/tournaments` — create tournament, generates a unique slug (retries `name-2`, `name-3`, … on collision).
  - `POST /api/tournaments/[slug]/days` — add day, auto-increments `day_number`.
  - `POST /api/tournaments/[slug]/teams` — add team (also used by the inline "+ Create team" in `TeamSelect`).
  - `POST /api/days/[dayId]/matches` — add match, auto-increments `match_number`.
  - `POST /api/matches/[matchId]/slots/init` — bulk-create N empty slots for a match (idempotent — if slots already exist for that match, returns them instead of duplicating, guarding against double-init from two tabs).
  - `PATCH /api/slots/[slotId]` — update team/position/kills/lock on one slot, returns the row with DB-computed `placement_points`/`total_points`/`wwcd` as the authoritative values.
- `npm run build` passes clean (typecheck + lint + build all green) as of this session.
- **Not yet pushed/deployed** — these Session 2 changes exist locally in this sandbox only. You'll need to copy them into your existing repo and push; Vercel will auto-redeploy since it's already connected. No schema changes were needed (Session 2 uses the same tables from Session 1's migration).

## What's built (Session 3)

Standings aggregation + edit/delete for teams, days, and matches:

- **`supabase/migrations/0002_standings_views.sql`** — two Postgres views, `day_standings` and `tournament_standings`. Both are **inner-joined through `match_slots`** (not a `left join` from `teams`), so a team only appears once it's actually been assigned to a slot with results — this was checked against the reference tournament sheet, where a day's Overall Standings only lists that day's actual roster, and different days can have entirely different rosters. Includes explicit `grant select ... to anon, authenticated` on both views (Supabase's default privileges usually cover new views automatically, but this makes it certain rather than assumed). **Not yet run against the live Supabase project — you need to paste this into the SQL editor**, same as `0001_init.sql` was.
- **`lib/supabase/types.ts`** — added the `Views` entries for `day_standings`/`tournament_standings` (was `Record<string, never>` before).
- **`lib/data.ts`**:
  - `getDayStandings(dayId)` / `getTournamentStandings(tournamentId)` — read the two views, sorted `total_points desc, total_kills desc` as the tiebreaker.
  - `getDaysForTournament`, `getMatchesForDay`, `getTeamsForTournament` now each return one extra field (`match_count`, `slot_count`, `slot_count` respectively) computed via a second lightweight query rather than an embedded `matches(count)`/`match_slots(count)` select — sidesteps the postgrest-js embedded-count generics, which is the same class of typing issue Session 1 hit with plain column selects. These are additive fields; nothing that read the old shape breaks.
- **`components/StandingsTable.tsx`** — plain server-renderable table (rank / team / points / kills / WWCD count), used on both the day view and tournament dashboard.
- **`components/ConfirmButton.tsx`** — reusable inline "are you sure?" control (click → shows the cascade-consequence message + Confirm/Cancel) used by every delete action below. Not a modal — no dialog library in this project, and this fits the existing lightweight open/closed-toggle pattern the Add*Form components already use.
- **`components/TeamCard.tsx`** — replaces the plain team div: inline edit (name/tag) and delete-with-confirmation. The confirm message reflects `slot_count` ("Used in N slots — those will show as unassigned, scores stay") since deleting a team only nulls `match_slots.team_id` (`on delete set null`), it never deletes score history.
- **`components/DayRow.tsx`** / **`components/MatchRow.tsx`** — replace the plain Link blocks in the Days/Matches lists: still link through to the day/match, but now also have Edit (label-only for days, map-only for matches — `day_number`/`match_number` are intentionally not editable, see the API routes) and Delete-with-confirmation, message built from `match_count`/`slot_count` ("Deletes 4 matches and all their scores.").
- **New API routes**, same server-role-client pattern as everything else:
  - `PATCH /api/teams/[teamId]` / `DELETE /api/teams/[teamId]`
  - `PATCH /api/days/[dayId]` (label only) / `DELETE /api/days/[dayId]` (cascades to matches + slots)
  - `PATCH /api/matches/[matchId]` (map only) / `DELETE /api/matches/[matchId]` (cascades to slots)
- **Pages updated**: `/t/[slug]` now has a "Tournament Standings" section at the top (above Days/Teams — it's the headline info for a returning visitor) and uses `DayRow`/`TeamCard`. `/t/[slug]/day/[dayNumber]` now has an "Overall Standings — Day N" section and uses `MatchRow`.
- **`npm run build` passes clean** (typecheck + lint + build all green) — verified in this sandbox.
- **Not yet pushed/deployed**, and **the migration hasn't been run against your live Supabase project yet** — see the checklist below.

## What you (the human) need to do after Session 3

1. Open the Supabase SQL editor for this project and run `supabase/migrations/0002_standings_views.sql` (paste its contents in, same as you did for `0001_init.sql`).
2. Copy the updated project files into your local clone (or unzip over it).
3. `git add -A && git commit -m "Session 3: standings + team/day/match management" && git push` — Vercel auto-redeploys.
4. Click through: open a tournament with existing Day 1 data → confirm "Tournament Standings" shows the right teams/points/kills at the top → open Day 1 → confirm "Overall Standings — Day 1" matches what you'd expect from that day's matches alone → edit a team's tag → delete a team with 0 slots used (should have no scary warning) → try editing/deleting a match and a day, reading the confirmation message before confirming.

Tell the next session your confirmation this worked (or any bugs) so it can be recorded here.

## Schema (already in supabase/migrations/0001_init.sql)

- **tournaments** — `id, name, slug (unique), created_at`
- **days** — `id, tournament_id → tournaments, day_number, label, created_at`, unique on `(tournament_id, day_number)`
- **matches** — `id, day_id → days, match_number, map_name, created_at`, unique on `(day_id, match_number)`
- **teams** — `id, tournament_id → tournaments, name, tag, created_at`
- **match_slots** — `id, match_id → matches, slot_number, team_id → teams (nullable, on delete set null), is_locked, position, kills, created_at`, unique on `(match_id, slot_number)`
  - `placement_points`, `total_points`, `wwcd` are **generated (computed) columns** — Postgres always derives them from `position`/`kills`. Never write to them directly; any insert/update that includes them will error.
  - Points table: 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th=1, 8th=1, 9th+=0. `total_points = placement_points + kills`. `wwcd = (position = 1)`.
- RLS is **enabled** on all five tables with a public `select` policy (`using (true)`) on each. There are intentionally **no public write policies** — all writes happen server-side with the service role key, which bypasses RLS entirely.

## Env vars

Three vars, defined in `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (browser-safe, read-only via RLS)
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, server-only, bypasses RLS

## What you (the human) need to do manually after Session 2

Session 1's deploy (GitHub + Vercel + Supabase, all three env vars) is done and confirmed live.

The Session 2 code above was written in a sandbox without push access to your GitHub repo. You need to:

1. Copy the updated project files into your local clone (or unzip over it) of the existing repo.
2. `git add -A && git commit -m "Session 2: core CRUD + match score table" && git push`
3. Vercel will auto-redeploy on push since it's already connected — no new env vars or schema changes needed (Session 2 reuses the Session 1 tables as-is).
4. Once deployed, click through: create a tournament → add a day → add a match → open its score table → set a slot count → assign a couple of teams, positions, and kills → confirm Total/WWCD compute correctly and the "Saved" indicator appears.

Tell the next session your confirmation that this worked (or any bugs you hit) so it can be recorded here.

## Known gaps / not done yet

- No auth (intentional per the plan — deferred).
- No public read-only view separate from the edit view (intentional — deferred).
- No duplicate-team-name validation, no mobile/responsive pass, no empty/loading skeletons beyond basic "No X yet" text, no CSV export, no "duplicate match" shortcut, no WWCD row highlight in the match table — all Session 4 polish items per the plan.
- Editing a day only changes its `label`; editing a match only changes its `map_name`. `day_number`/`match_number` are intentionally locked to keep ordering/URLs/uniqueness constraints safe — there's no resequencing UI. Flag to the human if this becomes a real need; it's a deliberate scope cut, not an oversight.
- Standings views assume a team only "counts" for a day/tournament once it's been assigned to at least one slot — a newly-created team with zero matches played simply won't appear yet, by design.

## What Session 4 should do next

Per the plan, this is the polish pass:

1. Responsive/mobile pass — the match score table and standings tables need to work on a phone screen (horizontal scroll or stacked-card layout, not a squeezed table).
2. Empty/loading/error states across the board; friendlier surfacing of DB constraint errors (e.g. duplicate slot number) instead of raw Postgres error text.
3. Validation: reject negative Position/Kills (already true at the input level via `min`, but double-check the API routes reject them too), case-insensitive duplicate-team-name check within a tournament.
4. Quality-of-life: "Duplicate match" button (clone a match's slot/team structure into a new match with position/kills blanked), WWCD row highlight in `SlotRow`, CSV export of standings tables.
5. Visual pass for consistency, then a final production checklist (env vars in Vercel, RLS intent, full click-through) — see the original plan document for the exact checklist.

Full session prompt text lives in the original plan document (`bgmi-tournament-site-plan.md`) if you need to paste it verbatim into a fresh session — note that document's Session 4 prompt doesn't yet know about the specific components/routes built in Sessions 2–3 above, so tell the fresh session to read this file first regardless.
