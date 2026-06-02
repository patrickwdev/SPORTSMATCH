-- Sports Match: matches table (team + stat payloads stored as JSONB)
create table public.matches (
  id text primary key,
  sport text not null check (sport in ('NFL', 'MLB', 'MLS', 'WNBA')),
  away_team jsonb not null,
  home_team jsonb not null,
  start_time text not null,
  location text not null,
  week_label text not null,
  stats jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index matches_sport_idx on public.matches (sport);

alter table public.matches enable row level security;

create policy "Allow public read access"
  on public.matches
  for select
  to anon, authenticated
  using (true);
