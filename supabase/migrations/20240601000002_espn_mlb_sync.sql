-- ESPN MLB schedule cache (synced by scripts/sync-mlb-espn.mjs)

alter table public.matches
  add column if not exists espn_event_id text,
  add column if not exists game_status text,
  add column if not exists status_detail text,
  add column if not exists away_score integer,
  add column if not exists home_score integer,
  add column if not exists source text not null default 'seed',
  add column if not exists synced_at timestamptz;

create unique index if not exists matches_espn_event_id_idx
  on public.matches (espn_event_id)
  where espn_event_id is not null;

create index if not exists matches_mlb_source_date_idx
  on public.matches (sport, source, game_date)
  where sport = 'MLB';

create table if not exists public.mlb_sync_runs (
  id bigserial primary key,
  sync_type text not null check (sync_type in ('daily', 'live')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  games_upserted integer not null default 0,
  games_updated integer not null default 0,
  error text
);

alter table public.mlb_sync_runs enable row level security;
