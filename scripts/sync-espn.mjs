/**
 * Sync any ESPN-backed league into Supabase (7-day window).
 *
 * Usage:
 *   node scripts/sync-espn.mjs MLB
 *   node scripts/sync-espn.mjs NHL --live
 *
 * Leagues: MLB, NBA, NHL, MLS, WNBA, NCAAB, NCAAW
 */

import { createClient } from '@supabase/supabase-js';
import { ESPN_LEAGUES, getLeagueSyncApis } from './lib/espn-leagues.mjs';
import { getSupabaseServiceConfig } from './lib/env.mjs';
import { runEspnSync } from './lib/sync-espn-sport.mjs';

const sportKey = process.argv.find((arg) => arg in ESPN_LEAGUES);
if (!sportKey) {
  console.error(`Usage: node scripts/sync-espn.mjs <${Object.keys(ESPN_LEAGUES).join('|')}> [--live]`);
  process.exit(1);
}

const { url, serviceKey } = getSupabaseServiceConfig();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

try {
  await runEspnSync({
    supabase,
    ...getLeagueSyncApis(/** @type {keyof typeof ESPN_LEAGUES} */ (sportKey)),
    isLive: process.argv.includes('--live'),
  });
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
