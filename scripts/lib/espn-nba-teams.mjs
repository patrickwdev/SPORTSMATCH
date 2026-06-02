import { buildTeamLookup, fetchEspnTeams, applyTeamLookup } from './espn-team-utils.mjs';

const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';

export { applyTeamLookup };

export async function fetchEspnNbaTeams() {
  return fetchEspnTeams(TEAMS_URL, 'NBA');
}

export const buildNbaTeamLookup = buildTeamLookup;
