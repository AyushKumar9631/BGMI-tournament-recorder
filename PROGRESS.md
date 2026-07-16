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
  - `lib/supabase/types.ts` — hand-written `Database` type matching the schema below. Swap for real `supabase gen types` output later if wanted; shape is compatible.
- Full SQL schema written as `supabase/migrations/0001_init.sql` (see below for the tables). This has **not been run against a live Supabase project yet** — see "What you need to do manually" below.
- `.env.local.example` committed (three vars, see below). A blank `.env.local` exists locally (gitignored) — needs real values pasted in.
- Placeholder homepage (`app/page.tsx`) is a server component that queries `select count(*) from tournaments` using the service-role client. It renders one of two states:
  - Not connected yet → amber "Not connected yet" box explaining why (missing env vars, or a Supabase error message).
  - Connected → green count of rows in `tournaments` (will read 0 until Session 2 adds a create-tournament form).
- `npm run build` passes clean (typecheck + lint + build all green) as of this session.
- Git repo initialized locally. **Not yet pushed to GitHub. Not yet deployed to Vercel.** (No GitHub/Vercel credentials were available in this session — see below.)

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

## What you (the human) need to do manually before Session 2

These are the steps a coding session can't do for you:

1. **Create a Supabase project** at supabase.com if you haven't already.
2. **Run the schema**: open the Supabase SQL editor and paste in the contents of `supabase/migrations/0001_init.sql`, then run it.
3. **Get your three keys**: Project Settings → API → copy Project URL, `anon` `public` key, and `service_role` `secret` key.
4. **Fill in `.env.local`** locally with those three values (file already exists, gitignored, just needs the values).
5. **Create a GitHub repo** and push this project to it (`git remote add origin <url> && git push -u origin main`) — not yet done.
6. **Connect the repo to Vercel** (import project on vercel.com), and add the same three env vars in Vercel's Project Settings → Environment Variables (all three — including the secret one, Vercel keeps server env vars private).
7. **Deploy**, then confirm the homepage shows "Connected to Supabase — 0 rows in tournaments".

Once that's done, tell the next session your live Vercel URL and GitHub repo so it can be recorded here.

## Known gaps / not done yet

- Not pushed to GitHub, not deployed to Vercel (blocked on step 5/6 above — needs your manual action, no credentials were available in this session).
- No real UI beyond the connection-check homepage.
- No CRUD for tournaments/days/matches/teams yet.
- No auth (intentional per the plan — deferred).
- No public read-only view separate from the edit view (intentional — deferred).

## What Session 2 should do next

Build the core editing flow:

1. Home page: list tournaments + "Create tournament" form (name + auto-slug).
2. Tournament dashboard `/t/[slug]`: list Days, "Add Day" button, Teams section with "Add team" form.
3. Day view `/t/[slug]/day/[dayNumber]`: list Matches, "Add Match" button (map dropdown: Erangel/Miramar/Sanhok/Vikendi/Rondo/Livik/Other).
4. Match score table `/t/[slug]/day/[dayNumber]/match/[matchNumber]` — the core screen: Slot/Team/Position/Kills/Total/WWCD, configurable slot count (default 22), team-select dropdown with inline "+ create team", lock toggle, live-computed Total/WWCD display, autosave-on-blur (debounced) per row with a saved/saving indicator, sortable by Position or Total without changing slot numbers.
5. All writes via API routes / server actions using `lib/supabase/server.ts` — never write from the client directly.
6. Deploy and confirm the live Vercel URL reflects it before finishing.

Full session prompt text lives in the original plan document (`bgmi-tournament-site-plan.md`) if you need to paste it verbatim into a fresh session.
