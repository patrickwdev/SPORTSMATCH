-- NCAAF (college football) — ESPN cache (mirrors NFL)

alter table public.matches drop constraint if exists matches_sport_check;
alter table public.matches add constraint matches_sport_check
  check (sport in ('NFL', 'NCAAF', 'MLB', 'MLS', 'WNBA', 'NBA', 'NHL', 'NCAAB', 'NCAAW'));

create table if not exists public.ncaaf_teams (
  espn_id text primary key,
  abbreviation text not null,
  display_name text not null,
  short_name text,
  slug text,
  color text not null default '#333333',
  alternate_color text,
  logo_url text not null,
  logo_url_dark text,
  location text,
  updated_at timestamptz not null default now()
);

create index if not exists ncaaf_teams_abbreviation_idx on public.ncaaf_teams (abbreviation);

alter table public.ncaaf_teams enable row level security;

drop policy if exists "Allow public read access on ncaaf_teams" on public.ncaaf_teams;
create policy "Allow public read access on ncaaf_teams"
  on public.ncaaf_teams for select to anon, authenticated using (true);

create table if not exists public.ncaaf_sync_runs (
  id bigserial primary key,
  sync_type text not null check (sync_type in ('daily', 'live')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  games_upserted integer not null default 0,
  games_updated integer not null default 0,
  error text
);

alter table public.ncaaf_sync_runs enable row level security;

create index if not exists matches_ncaaf_espn_date_idx
  on public.matches (sport, game_date) where sport = 'NCAAF';
