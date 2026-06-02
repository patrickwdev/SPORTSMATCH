import {
  getMatchById as getMockMatchById,
  getMatchesForSport as getMockMatchesForSport,
  getWeekLabel as getMockWeekLabel,
  matches as mockMatches,
} from './mockData';
import { rowToMatch, type MatchRow } from '../lib/database.types';
import { enrichTeamWithEspnCache, type EspnTeamRow } from '../lib/espnTeamCache';
import {
  ESPN_CACHED_SPORTS,
  fetchTeamLookupForSport,
  isEspnCachedSport,
  type EspnCachedSport,
} from '../lib/espnLeagues';
import { enrichMatchTeamRecords } from '../lib/espnTeamRecord';
import { fetchEspnMatchStats } from '../lib/espnStats';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Match, Sport } from '../types';

export { isSupabaseConfigured };

function enrichEspnMatch(match: Match, lookup: Map<string, EspnTeamRow>): Match {
  return {
    ...match,
    awayTeam: enrichTeamWithEspnCache(match.awayTeam, lookup),
    homeTeam: enrichTeamWithEspnCache(match.homeTeam, lookup),
  };
}

async function fetchEspnSportFromDatabase(sport: EspnCachedSport): Promise<Match[]> {
  if (!supabase) {
    return [];
  }

  const { idPattern } = ESPN_CACHED_SPORTS[sport];

  const { data: espnRows, error: espnError } = await supabase
    .from('matches')
    .select('*')
    .eq('sport', sport)
    .like('id', idPattern)
    .order('start_time', { ascending: true });

  if (espnError) {
    throw new Error(espnError.message);
  }

  const teamLookup = await fetchTeamLookupForSport(sport);
  return (espnRows ?? []).map((row) => enrichEspnMatch(rowToMatch(row), teamLookup));
}

export async function fetchMatchesForSport(sport: Sport): Promise<Match[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getMockMatchesForSport(sport);
  }

  if (isEspnCachedSport(sport)) {
    return fetchEspnSportFromDatabase(sport);
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('sport', sport)
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as MatchRow[]).map(rowToMatch);
}

export async function fetchMatchById(id: string): Promise<Match | null> {
  if (!isSupabaseConfigured || !supabase) {
    return getMockMatchById(id) ?? null;
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  let match = rowToMatch(data as MatchRow);
  if (!isEspnCachedSport(match.sport)) {
    return match;
  }

  const teamLookup = await fetchTeamLookupForSport(match.sport);
  match = enrichEspnMatch(match, teamLookup);

  const records = await enrichMatchTeamRecords({
    sport: match.sport,
    awayTeam: match.awayTeam,
    homeTeam: match.homeTeam,
  });
  match = { ...match, awayTeam: records.awayTeam, homeTeam: records.homeTeam };

  try {
    const stats = await fetchEspnMatchStats(
      match.sport,
      match.awayTeam.id,
      match.homeTeam.id,
    );
    if (stats.length > 0) {
      match = { ...match, stats };
    }
  } catch {
    // Stats are best-effort; keep synced DB stats if live fetch fails.
  }

  return match;
}

export async function fetchWeekLabel(sport: Sport): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return getMockWeekLabel(sport);
  }

  const { data, error } = await supabase
    .from('matches')
    .select('week_label')
    .eq('sport', sport)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.week_label ?? 'This Week';
}

/** All mock matches — used by the local seed script. */
export function getSeedMatches(): Match[] {
  return mockMatches;
}
