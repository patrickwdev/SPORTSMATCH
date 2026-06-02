import { isSupabaseConfigured, supabase } from './supabase';
import type { TeamSummary } from '../types';

export type EspnTeamRow = {
  espn_id: string;
  abbreviation: string;
  display_name: string;
  color: string;
  logo_url: string;
};

export type EspnTeamTable =
  | 'nfl_teams'
  | 'mlb_teams'
  | 'nba_teams'
  | 'nhl_teams'
  | 'mls_teams'
  | 'wnba_teams';

export async function fetchEspnTeamLookup(
  table: EspnTeamTable,
): Promise<Map<string, EspnTeamRow>> {
  if (!isSupabaseConfigured || !supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(table)
    .select('espn_id, abbreviation, display_name, color, logo_url');

  if (error || !data?.length) {
    return new Map();
  }

  return new Map((data as EspnTeamRow[]).map((row) => [row.espn_id, row]));
}

export function enrichTeamWithEspnCache(
  team: TeamSummary,
  lookup: Map<string, EspnTeamRow>,
): TeamSummary {
  if (team.logoUrl) {
    return team;
  }

  const cached = lookup.get(team.id);
  if (!cached) {
    return team;
  }

  return {
    ...team,
    name: team.name || cached.display_name,
    abbreviation: team.abbreviation || cached.abbreviation,
    color: team.color && team.color !== '#333333' ? team.color : cached.color,
    logoUrl: cached.logo_url,
  };
}
