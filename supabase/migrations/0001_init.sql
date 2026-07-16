-- 0001_init.sql
-- Initial schema for the BGMI tournament tracker.
-- Run this once in the Supabase SQL editor for a fresh project.

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
