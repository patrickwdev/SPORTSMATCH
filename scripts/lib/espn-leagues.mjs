import { createEspnScheduleApi } from './espn-schedule.mjs';
import { buildTeamLookup, fetchEspnTeams } from './espn-team-utils.mjs';

/** @typedef {'NFL'|'MLB'|'NBA'|'NHL'|'MLS'|'WNBA'|'NCAAB'|'NCAAW'} EspnLeagueKey */

/** @type {Record<EspnLeagueKey, { sport: string; idPrefix: string; idLikePattern: string; teamsUrl: string; scoreboardUrl: string; teamsTable: string; syncRunsTable: string }>} */
export const ESPN_LEAGUES = {
  NFL: {
    sport: 'NFL',
    idPrefix: 'espn-nfl',
    idLikePattern: 'espn-nfl-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    teamsTable: 'nfl_teams',
    syncRunsTable: 'nfl_sync_runs',
    scheduleStrategy: 'range',
    rangeLookaheadDays: 21,
  },
  MLB: {
    sport: 'MLB',
    idPrefix: 'espn',
    idLikePattern: 'espn-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    teamsTable: 'mlb_teams',
    syncRunsTable: 'mlb_sync_runs',
  },
  NBA: {
    sport: 'NBA',
    idPrefix: 'espn-nba',
    idLikePattern: 'espn-nba-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    teamsTable: 'nba_teams',
    syncRunsTable: 'nba_sync_runs',
  },
  NHL: {
    sport: 'NHL',
    idPrefix: 'espn-nhl',
    idLikePattern: 'espn-nhl-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    teamsTable: 'nhl_teams',
    syncRunsTable: 'nhl_sync_runs',
  },
  MLS: {
    sport: 'MLS',
    idPrefix: 'espn-mls',
    idLikePattern: 'espn-mls-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
    teamsTable: 'mls_teams',
    syncRunsTable: 'mls_sync_runs',
    scheduleStrategy: 'range',
    rangeLookaheadDays: 21,
  },
  WNBA: {
    sport: 'WNBA',
    idPrefix: 'espn-wnba',
    idLikePattern: 'espn-wnba-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    teamsTable: 'wnba_teams',
    syncRunsTable: 'wnba_sync_runs',
  },
  NCAAB: {
    sport: 'NCAAB',
    idPrefix: 'espn-ncaab',
    idLikePattern: 'espn-ncaab-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams',
    scoreboardUrl:
      'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    teamsTable: 'ncaab_teams',
    syncRunsTable: 'ncaab_sync_runs',
  },
  NCAAW: {
    sport: 'NCAAW',
    idPrefix: 'espn-ncaaw',
    idLikePattern: 'espn-ncaaw-%',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams',
    scoreboardUrl:
      'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard',
    teamsTable: 'ncaaw_teams',
    syncRunsTable: 'ncaaw_sync_runs',
  },
};

/** @param {EspnLeagueKey} key */
export function getLeagueSyncApis(key) {
  const league = ESPN_LEAGUES[key];
  if (!league) {
    throw new Error(`Unknown ESPN league: ${key}. Use one of: ${Object.keys(ESPN_LEAGUES).join(', ')}`);
  }

  const schedule = createEspnScheduleApi({
    sport: league.sport,
    idPrefix: league.idPrefix,
    scoreboardUrl: league.scoreboardUrl,
    scheduleStrategy: league.scheduleStrategy,
    rangeLookaheadDays: league.rangeLookaheadDays,
  });

  return {
    sport: league.sport,
    teamsUrl: league.teamsUrl,
    idLikePattern: league.idLikePattern,
    teamsTable: league.teamsTable,
    syncRunsTable: league.syncRunsTable,
    fetchTeams: () => fetchEspnTeams(league.teamsUrl, league.sport),
    buildTeamLookup: buildTeamLookup,
    fetchScheduleWindow: schedule.fetchScheduleWindow,
    fetchScoreboardForDate: schedule.fetchScoreboardForDate,
    hasActiveGames: schedule.hasActiveGames,
  };
}
