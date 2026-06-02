/**
 * Seeds Supabase with mock match data.
 *
 * Usage (from project root):
 *   set SUPABASE_URL=https://xxx.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   node scripts/seed-supabase.mjs
 *
 * Requires the matches table migration to be applied first.
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadDotEnv() {
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

// Load compiled mock matches via a small JSON export generated at build time,
// or inline by evaluating mockData — we read seed-data.json if present.
const seedPath = join(__dirname, 'seed-data.json');
let matches;
try {
  matches = JSON.parse(readFileSync(seedPath, 'utf8'));
} catch {
  console.error(
    'Run `npm run db:export-seed` first to generate scripts/seed-data.json from mock data.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Leagues filled by ESPN sync — do not seed mock games for these. */
const ESPN_SYNC_SPORTS = new Set(['NFL', 'MLB', 'NBA', 'NHL', 'MLS', 'WNBA', 'NCAAB', 'NCAAW']);
const seedMatches = matches.filter((m) => !ESPN_SYNC_SPORTS.has(m.sport));

const rows = seedMatches.map((m) => ({
  id: m.id,
  sport: m.sport,
  away_team: m.awayTeam,
  home_team: m.homeTeam,
  start_time: m.startTime,
  location: m.location,
  week_label: m.weekLabel,
  game_date: m.gameDate,
  stats: m.stats,
  source: 'seed',
}));

const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'id' });

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

if (rows.length === 0) {
  console.log(
    'No seed rows written — all leagues use ESPN sync (npm run sync:nfl|mlb|nba|nhl|mls|wnba or sync:all).',
  );
} else {
  console.log(`Seeded ${rows.length} matches.`);
}
