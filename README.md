# Sports Matchup Dashboard

React Native + Expo app for viewing weekly sports matchups and detailed statistical match sheets.

## Features

- **Welcome screen** — League picker (NFL, MLB, MLS, NBA, NHL, WNBA) and navigation to the week’s schedule
- **Matches list** — 7-day picker; games filtered by day
- **Match sheet** — Dark-themed statistical comparison (team records, info bar, scrollable stats grid)
- **Team logos** — Cached from ESPN for MLB, NBA, NHL, MLS, WNBA
- **Supabase backend** — Optional; falls back to local mock data when env vars are not set

## Run locally

```bash
cd sports-match
npm install
cp .env.example .env   # optional — see Supabase setup below
npm start
```

Then press `w` for web, scan the QR code with Expo Go on your phone, or run `npm run android` / `npm run ios`.

Without a `.env` file, the app uses bundled mock data in `src/data/mockData.ts`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the project URL and `anon` public key.
3. Create `.env` in the project root (see `.env.example`):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. Apply the database schema. Run all SQL files in `supabase/migrations/` in order in the Supabase **SQL Editor**, or use the Supabase CLI: `supabase link` then `supabase db push`

5. Seed match data (optional, for non-ESPN leagues / demos):

   ```bash
   npm run db:export-seed
   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   npm run db:seed
   ```

6. Restart Expo (`npm start`) so env vars load.

Row Level Security allows public read access on `matches` and `*_teams` tables; only seeding/sync requires the service role.

## ESPN schedule cache (MLB, NBA, NHL, MLS, WNBA)

The app **never** calls ESPN at runtime. Sync jobs pull **teams (logos)** and **games (today + 6 days)** into Supabase; the mobile app only reads your database.

### One-time setup

1. Apply all migrations through `20240601000006_nfl.sql`.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`.
3. Sync each league (or all at once):

   ```bash
   npm run sync:all
   ```

   Or individually:

   ```bash
   npm run sync:nfl
   npm run sync:mlb
   npm run sync:nba
   npm run sync:nhl
   npm run sync:mls
   npm run sync:wnba
   ```

### Sync commands

| Command | What it does |
|---------|----------------|
| `npm run sync:{league}` | Daily — sync teams + 7-day schedule (`league` = nfl, mlb, nba, nhl, mls, wnba) |
| `npm run sync:{league}:live` | Live — update today’s scores/status for today |
| `npm run sync:live:all` | Run live sync for all six leagues (use on a 10‑min timer locally) |
| `npm run sync:all` | Run daily sync for all six leagues |

Live sync **skips** ESPN when there are no scheduled or in-progress games today (saves API calls on off days).

**Local 10‑minute updates (Windows):** Task Scheduler → repeat every 10 minutes → action: `npm run sync:live:all` in your project folder (with `.env` and service role key set).

### Team tables

| League | Teams table | Game id prefix |
|--------|-------------|----------------|
| NFL | `nfl_teams` | `espn-nfl-{eventId}` |
| MLB | `mlb_teams` | `espn-{eventId}` |
| NBA | `nba_teams` | `espn-nba-{eventId}` |
| NHL | `nhl_teams` | `espn-nhl-{eventId}` |
| MLS | `mls_teams` | `espn-mls-{eventId}` |
| WNBA | `wnba_teams` | `espn-wnba-{eventId}` |

### Automated cron (GitHub Actions)

Add secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

- `sync-espn-schedule.yml` — daily 05:00 UTC, all 6 leagues
- `sync-espn-live.yml` — **every 10 minutes**, all 6 leagues

### Notes

- ESPN API is unofficial (`site.api.espn.com`); treat as best-effort.
- Synced ESPN games have empty stats on the match sheet until you add a stats source.
- Mock data is used only when Supabase is not configured. All ESPN-synced leagues never fall back to mock after Supabase is enabled.
- **NFL** and **MLS** use a 21-day fetch window (weekly/sparse schedules); games are placed on their real kickoff date (Eastern). Off-season or bye weeks show empty days.

## Project structure

```
src/
  components/     UI building blocks (MatchCard, match sheet parts)
  constants/      Shared constants (sports list)
  data/           Mock data + Supabase fetch layer
  hooks/          useMatchesForSport, useMatch
  lib/            Supabase client, ESPN league config, team cache
  navigation/     React Navigation stack
  screens/        Welcome, Matches, MatchSheet
  theme/          Colors
  types/          TypeScript models
  utils/          Formatting and rank colors
supabase/
  migrations/     Postgres schema
scripts/          Seed export, ESPN sync, Supabase upsert
```

## Data model

The `matches` table stores each game as one row with JSONB columns for `away_team`, `home_team`, and `stats`, matching the app’s `Match` type in `src/types/index.ts`.
