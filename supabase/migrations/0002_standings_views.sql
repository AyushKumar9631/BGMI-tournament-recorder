-- 0002_standings_views.sql
-- Standings aggregation for Session 3. Run this once in the Supabase SQL
-- editor, after 0001_init.sql has already been applied.
--
-- Both views only include a team once it has at least one match_slots row
-- assigned to it (an inner join through match_slots, not a left join from
-- teams) — this deliberately matches the reference tournament sheet, where
-- a day's "Overall Standings" only lists teams that actually played that
-- day, and a day's roster can be entirely different from another day's.
-- A team that's been created but never assigned to a slot simply won't
-- appear yet, which is correct (it has no results to show).

create view day_standings as
select
  m.day_id,
  d.tournament_id,
  t.id as team_id,
  t.name as team_name,
  t.tag as team_tag,
  sum(ms.total_points)::int as total_points,
  sum(ms.kills)::int as total_kills,
  sum(case when ms.wwcd then 1 else 0 end)::int as wwcd_count
from match_slots ms
join matches m on m.id = ms.match_id
join days d on d.id = m.day_id
join teams t on t.id = ms.team_id
where ms.team_id is not null
group by m.day_id, d.tournament_id, t.id, t.name, t.tag;

create view tournament_standings as
select
  t.tournament_id,
  t.id as team_id,
  t.name as team_name,
  t.tag as team_tag,
  sum(ms.total_points)::int as total_points,
  sum(ms.kills)::int as total_kills,
  sum(case when ms.wwcd then 1 else 0 end)::int as wwcd_count
from match_slots ms
join teams t on t.id = ms.team_id
where ms.team_id is not null
group by t.tournament_id, t.id, t.name, t.tag;

-- Every existing RLS policy on the base tables is an unconditional
-- `using (true)` (public read, no per-row restriction), so there's no
-- row-level filtering for these views to inherit correctly either way —
-- any role that can select the view gets every row. No new RLS policies
-- are needed. What views do NOT automatically inherit is the anon/
-- authenticated SELECT *grant* — Supabase's default privileges usually
-- extend to new views too, but grant explicitly so this doesn't silently
-- 403 if that default was ever changed on your project.
grant select on day_standings to anon, authenticated;
grant select on tournament_standings to anon, authenticated;
