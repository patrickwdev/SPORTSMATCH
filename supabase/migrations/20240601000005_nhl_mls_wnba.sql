-- NHL, MLS, WNBA: team directories + sync logging (ESPN cache)

alter table public.matches drop constraint if exists matches_sport_check;
alter table public.matches add constraint matches_sport_check
  check (sport in ('NFL', 'MLB', 'MLS', 'WNBA', 'NBA', 'NHL'));

create table if not exists public.nhl_teams (
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

create index if not exists nhl_teams_abbreviation_idx on public.nhl_teams (abbreviation);

alter table public.nhl_teams enable row level security;

create policy "Allow public read access on nhl_teams"
  on public.nhl_teams for select to anon, authenticated using (true);

create table if not exists public.mls_teams (
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

create index if not exists mls_teams_abbreviation_idx on public.mls_teams (abbreviation);

alter table public.mls_teams enable row level security;

create policy "Allow public read access on mls_teams"
  on public.mls_teams for select to anon, authenticated using (true);

create table if not exists public.wnba_teams (
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

create index if not exists wnba_teams_abbreviation_idx on public.wnba_teams (abbreviation);

alter table public.wnba_teams enable row level security;

create policy "Allow public read access on wnba_teams"
  on public.wnba_teams for select to anon, authenticated using (true);

create table if not exists public.nhl_sync_runs (
  id bigserial primary key,
  sync_type text not null check (sync_type in ('daily', 'live')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  games_upserted integer not null default 0,
  games_updated integer not null default 0,
  error text
);

alter table public.nhl_sync_runs enable row level security;

create table if not exists public.mls_sync_runs (
  id bigserial primary key,
  sync_type text not null check (sync_type in ('daily', 'live')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  games_upserted integer not null default 0,
  games_updated integer not null default 0,
  error text
);

alter table public.mls_sync_runs enable row level security;

create table if not exists public.wnba_sync_runs (
  id bigserial primary key,
  sync_type text not null check (sync_type in ('daily', 'live')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  games_upserted integer not null default 0,
  games_updated integer not null default 0,
  error text
);

alter table public.wnba_sync_runs enable row level security;

create index if not exists matches_nhl_espn_date_idx
  on public.matches (sport, game_date) where sport = 'NHL';

create index if not exists matches_mls_espn_date_idx
  on public.matches (sport, game_date) where sport = 'MLS';

create index if not exists matches_wnba_espn_date_idx
  on public.matches (sport, game_date) where sport = 'WNBA';
