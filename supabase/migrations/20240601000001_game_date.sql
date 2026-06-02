alter table public.matches
  add column if not exists game_date text;

create index if not exists matches_sport_game_date_idx
  on public.matches (sport, game_date);
