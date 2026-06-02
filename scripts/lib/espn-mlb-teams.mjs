import { buildTeamLookup, fetchEspnTeams, applyTeamLookup, teamColor, pickTeamLogoUrl, pickTeamLogoUrlDark, mapEspnTeamRow } from './espn-team-utils.mjs';

const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams';

export { teamColor, pickTeamLogoUrl, pickTeamLogoUrlDark, mapEspnTeamRow, applyTeamLookup };

export async function fetchEspnMlbTeams() {
  return fetchEspnTeams(TEAMS_URL, 'MLB');
}

export const buildMlbTeamLookup = buildTeamLookup;
