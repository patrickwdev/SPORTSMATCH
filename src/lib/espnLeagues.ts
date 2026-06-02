import { fetchEspnTeamLookup, type EspnTeamTable } from './espnTeamCache';
import type { Sport } from '../types';

export type EspnCachedSport = 'NFL' | 'MLB' | 'NBA' | 'NHL' | 'MLS' | 'WNBA';

export type { EspnTeamTable };

export const ESPN_CACHED_SPORTS: Record<
  EspnCachedSport,
  { idPattern: string; teamsTable: EspnTeamTable }
> = {
  NFL: { idPattern: 'espn-nfl-%', teamsTable: 'nfl_teams' },
  MLB: { idPattern: 'espn-%', teamsTable: 'mlb_teams' },
  NBA: { idPattern: 'espn-nba-%', teamsTable: 'nba_teams' },
  NHL: { idPattern: 'espn-nhl-%', teamsTable: 'nhl_teams' },
  MLS: { idPattern: 'espn-mls-%', teamsTable: 'mls_teams' },
  WNBA: { idPattern: 'espn-wnba-%', teamsTable: 'wnba_teams' },
};

export function isEspnCachedSport(sport: Sport): sport is EspnCachedSport {
  return sport in ESPN_CACHED_SPORTS;
}

export function fetchTeamLookupForSport(sport: EspnCachedSport) {
  return fetchEspnTeamLookup(ESPN_CACHED_SPORTS[sport].teamsTable);
}
