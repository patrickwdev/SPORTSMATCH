-- MLB team directory (logos + metadata for schedule UI and future syncs)

create table if not exists public.mlb_teams (
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

create index if not exists mlb_teams_abbreviation_idx on public.mlb_teams (abbreviation);

alter table public.mlb_teams enable row level security;

create policy "Allow public read access on mlb_teams"
  on public.mlb_teams
  for select
  to anon, authenticated
  using (true);
