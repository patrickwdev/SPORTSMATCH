/**
 * Build match-sheet StatRow[] from ESPN team statistics.
 */

import { extractNbaGameTotalsValue, fetchNbaGameTotals } from './espn-nba-game-totals.mjs';
import {
  extractNhlGameTotalsValue,
  extractNhlRecordSplitValue,
  fetchNhlGameTotals,
  fetchNhlRecordSplits,
} from './espn-nhl-splits.mjs';

const BASKETBALL_GAME_LOG_SPORTS = new Set(['NBA', 'WNBA', 'NCAAB', 'NCAAW']);

const BASKETBALL_STAT_DEFS = [
  {
    id: '1',
    label: 'Points/G',
    category: 'offensive',
    name: 'avgPoints',
    nbaGameLog: 'pointsFor',
  },
  { id: '2', label: 'Opp Pts/G', recordName: 'avgPointsAgainst', lowerIsBetter: true, nbaGameLog: 'pointsAgainst' },
  { id: '3', label: '2PT %', category: 'offensive', name: 'fieldGoalPct', format: 'percent', scale: 100, nbaGameLog: 'twoPointPct' },
  { id: '4', label: 'OPP 2PT %', category: 'defensive', name: 'fieldGoalPct', format: 'percent', scale: 100, lowerIsBetter: true, nbaGameLog: 'oppTwoPointPct' },
  { id: '5', label: '3PT %', category: 'offensive', name: 'threePointPct', format: 'percent', scale: 0.01, nbaGameLog: 'threePointFieldGoalPct' },
  { id: '6', label: 'Opp 3PT %', category: 'defensive', name: 'threePointPct', format: 'percent', scale: 0.01, lowerIsBetter: true, nbaGameLog: 'oppThreePointPct' },
  { id: '7', label: 'Rebounds/G', category: 'general', name: 'avgRebounds', nbaGameLog: 'totalRebounds' },
  { id: '8', label: 'Assists/G', category: 'offensive', name: 'avgAssists', nbaGameLog: 'assists' },
  { id: '9', label: 'FGM', category: 'offensive', name: 'fieldGoalsMade', nbaGameLog: 'fieldGoalsMade' },
  { id: '10', label: 'FG %', category: 'offensive', name: 'fieldGoalPct', format: 'percent', scale: 0.01, nbaGameLog: 'fieldGoalPct' },
  { id: '11', label: 'FT %', category: 'offensive', name: 'freeThrowPct', format: 'percent', scale: 0.01, nbaGameLog: 'freeThrowPct' },
  { id: '12', label: 'Turnovers/G', category: 'offensive', name: 'avgTurnovers', lowerIsBetter: true, nbaGameLog: 'turnovers' },
  { id: '13', label: 'Steals/G', category: 'defensive', name: 'avgSteals', nbaGameLog: 'steals' },
  { id: '14', label: 'Blocks/G', category: 'defensive', name: 'avgBlocks', nbaGameLog: 'blocks' },
  { id: '15', label: 'Pace', category: 'general', name: 'pace', nbaGameLog: 'pace' },
];

/** @type {Record<string, { teamsUrl: string; sport: string; stats: object[] }>} */
export const ESPN_STAT_LEAGUES = {
  MLB: {
    sport: 'MLB',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
    stats: [
      { id: '1', label: 'Runs/G', category: 'batting', name: 'runs', perGame: true },
      { id: '2', label: 'Opp Runs/G', category: 'pitching', name: 'runs', perGame: true, lowerIsBetter: true },
      { id: '3', label: 'Hits/G', category: 'batting', name: 'hits', perGame: true },
      { id: '4', label: 'HR/G', category: 'batting', name: 'homeRuns', perGame: true },
      { id: '5', label: 'BA', category: 'batting', name: 'avg', format: 'decimal' },
      { id: '6', label: 'ERA', category: 'pitching', name: 'ERA', lowerIsBetter: true },
      { id: '7', label: 'WHIP', category: 'pitching', name: 'WHIP', format: 'decimal', lowerIsBetter: true },
      { id: '8', label: 'K/9', category: 'pitching', name: 'strikeoutsPerNineInnings' },
      { id: '9', label: 'SB/G', category: 'batting', name: 'stolenBases', perGame: true },
      { id: '10', label: 'Errors/G', category: 'fielding', name: 'errors', perGame: true, lowerIsBetter: true },
    ],
  },
  NFL: {
    sport: 'NFL',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    stats: [
      { id: '1', label: 'Points/G', category: 'scoring', name: 'totalPointsPerGame' },
      { id: '2', label: 'Opp Pts/G', category: 'scoring', name: 'totalPointsPerGame', opponent: true, lowerIsBetter: true },
      { id: '3', label: 'Pass Yds/G', category: 'passing', name: 'netPassingYardsPerGame' },
      { id: '4', label: 'Rush Yds/G', category: 'rushing', name: 'rushingYardsPerGame' },
      { id: '5', label: 'Total Yds/G', category: 'miscellaneous', name: 'yardsPerGame' },
      { id: '6', label: 'Opp Rush/G', category: 'rushing', name: 'rushingYardsPerGame', opponent: true, lowerIsBetter: true },
      { id: '7', label: '3rd Down %', category: 'miscellaneous', name: 'thirdDownConvPct', format: 'percent', scale: 0.01 },
      { id: '8', label: 'Red Zone %', category: 'miscellaneous', name: 'redzoneScoringPct', format: 'percent', scale: 0.01 },
      { id: '9', label: 'Turnovers/G', category: 'passing', name: 'interceptions', perGame: true, lowerIsBetter: true },
      { id: '10', label: 'Sacks/G', category: 'defensive', name: 'sacks', perGame: true },
      { id: '11', label: 'Penalties/G', category: 'miscellaneous', name: 'totalPenalties', perGame: true, lowerIsBetter: true },
      { id: '12', label: 'TOP (min)', category: 'miscellaneous', name: 'possessionTimeSeconds', perGame: true, scale: 1 / 60 },
    ],
  },
  NBA: {
    sport: 'NBA',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    stats: BASKETBALL_STAT_DEFS,
  },
  WNBA: {
    sport: 'WNBA',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams',
    stats: BASKETBALL_STAT_DEFS,
  },
  NCAAB: {
    sport: 'NCAAB',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams',
    stats: BASKETBALL_STAT_DEFS,
  },
  NCAAW: {
    sport: 'NCAAW',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams',
    stats: BASKETBALL_STAT_DEFS,
  },
  NHL: {
    sport: 'NHL',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    stats: [
      {
        id: '1',
        label: 'Goals/G',
        category: 'offensive',
        name: 'goals',
        perGame: true,
        nhlRecordSplit: 'avgPointsFor',
        nhlLast5: 'goalsFor',
      },
      {
        id: '2',
        label: 'Opp Goals/G',
        category: 'defensive',
        name: 'goalsAgainst',
        perGame: true,
        lowerIsBetter: true,
        nhlRecordSplit: 'avgPointsAgainst',
        nhlLast5: 'goalsAgainst',
      },
      { id: '3', label: 'Blocks/G', nhlLast5: 'blockedShots' },
      {
        id: '4',
        label: 'Shots/G',
        category: 'offensive',
        name: 'shotsTotal',
        perGame: true,
        nhlLast5: 'shotsTotal',
      },
      { id: '6', label: 'Shooting %', nhlLast5: 'shootingPct' },
      { id: '7', label: 'FW', nhlLast5: 'faceoffsWon' },
      { id: '8', label: 'FO %', nhlLast5: 'faceoffPct' },
      {
        id: '9',
        label: 'PPG/G',
        nhlRecordSplit: 'powerPlayGoalsPerGame',
        nhlLast5: 'powerPlayGoals',
      },
      {
        id: '10',
        label: 'PIM/G',
        category: 'penalties',
        name: 'penaltyMinutes',
        perGame: true,
        lowerIsBetter: true,
        nhlLast5: 'penaltyMinutes',
      },
    ],
  },
  MLS: {
    sport: 'MLS',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams',
    stats: [
      { id: '1', label: 'Goals/G', recordName: 'pointsFor', perGame: true, recordGp: 'gamesPlayed' },
      { id: '2', label: 'Opp Goals/G', recordName: 'pointsAgainst', perGame: true, recordGp: 'gamesPlayed', lowerIsBetter: true },
      { id: '3', label: 'Goals/G (H)', recordName: 'homePointsFor', perGame: true, recordGp: 'homeGamesPlayed' },
      { id: '4', label: 'Goals/G (A)', recordName: 'awayPointsFor', perGame: true, recordGp: 'awayGamesPlayed' },
      { id: '5', label: 'PPG', recordName: 'ppg' },
      { id: '6', label: 'GD/G', recordName: 'pointDifferential', perGame: true, recordGp: 'gamesPlayed' },
    ],
  },
};

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'sports-match-sync/1.0',
};

/** @param {object} block @param {string} categoryName @param {string} statName */
function findStat(block, categoryName, statName) {
  if (!block) return null;
  const categories = Array.isArray(block) ? block : block.categories;
  if (!categories) return null;
  const category = categories.find((c) => c.name === categoryName);
  return category?.stats?.find((s) => s.name === statName) ?? null;
}

/** @param {object} bundle @param {object} def @param {'season'|'home'|'away'|'last7'} split */
function extractStatValue(bundle, def, split) {
  if (split === 'home' && def.nhlRecordSplit && bundle.nhlRecordSplits?.home) {
    const value = extractNhlRecordSplitValue(bundle.nhlRecordSplits.home, def.nhlRecordSplit);
    if (value != null) return value;
  }
  if (split === 'away' && def.nhlRecordSplit && bundle.nhlRecordSplits?.road) {
    const value = extractNhlRecordSplitValue(bundle.nhlRecordSplits.road, def.nhlRecordSplit);
    if (value != null) return value;
  }
  if (def.nhlLast5 && bundle.nhlGameTotals) {
    const value = extractNhlGameTotalsValue(bundle.nhlGameTotals, split, def.nhlLast5);
    if (value != null) return value;
  }
  if (def.nbaGameLog && bundle.nbaGameTotals) {
    const value = extractNbaGameTotalsValue(bundle.nbaGameTotals, split, def.nbaGameLog);
    if (value != null) return value;
  }

  if (def.recordName) {
    const value = bundle.record?.[def.recordName];
    if (value == null || Number.isNaN(Number(value))) return null;
    let num = Number(value);
    if (def.perGame) {
      const gpName = def.recordGp ?? 'gamesPlayed';
      const gp = Number(bundle.record?.[gpName]);
      if (gp > 0) num = num / gp;
    }
    if (def.scale) num *= def.scale;
    return num;
  }

  const block =
    split === 'season'
      ? bundle.season
      : split === 'home'
        ? bundle.home
        : split === 'away'
          ? bundle.away
          : bundle.last7;

  const sourceBlock = def.opponent ? bundle.opponent : block;
  const stat = findStat(sourceBlock, def.category, def.name);
  if (!stat || stat.value == null || Number.isNaN(Number(stat.value))) return null;

  let num = Number(stat.value);
  if (def.perGame) {
    const perGame = stat.perGameValue;
    if (perGame != null && !Number.isNaN(Number(perGame))) {
      num = Number(perGame);
    } else {
      const gpStat =
        findStat(block, 'general', 'gamesPlayed') ??
        findStat(block, 'general', 'games') ??
        findStat(block, 'batting', 'teamGamesPlayed') ??
        findStat(bundle.season, 'general', 'gamesPlayed') ??
        findStat(bundle.season, 'general', 'games') ??
        findStat(bundle.season, 'batting', 'teamGamesPlayed');
      const gp = Number(gpStat?.value);
      if (gp > 0) num = num / gp;
    }
  }
  if (def.scale) num *= def.scale;
  return num;
}

/** @param {number} away @param {number} home @param {boolean} [lowerIsBetter] */
function compareAdvantage(away, home, lowerIsBetter) {
  const diff = away - home;
  if (Math.abs(diff) < 0.0001) return null;
  if (lowerIsBetter) return away < home;
  return away > home;
}

/** @param {Map<string, object>} cache @param {object} def @param {'last7'|'season'} split @param {string} teamId */
function computeRank(cache, def, split, teamId) {
  const values = [];
  for (const [id, bundle] of cache) {
    const value = extractStatValue(bundle, def, split === 'last7' ? 'last7' : 'season');
    if (value != null) values.push({ id, value });
  }
  if (values.length === 0) return 16;

  values.sort((a, b) => (def.lowerIsBetter ? a.value - b.value : b.value - a.value));
  const index = values.findIndex((v) => v.id === teamId);
  return index >= 0 ? index + 1 : Math.ceil(values.length / 2);
}

/** @param {string} teamsUrl @param {string} teamId */
async function fetchTeamRecord(teamsUrl, teamId) {
  const res = await fetch(`${teamsUrl}/${teamId}`, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  const items = data.team?.record?.items ?? [];
  const overall = items.find((i) => i.type === 'total') ?? items[0];
  if (!overall?.stats) return null;
  return Object.fromEntries(overall.stats.map((s) => [s.name, s.value]));
}

/** @param {string} sport @param {number} season @param {number|null} value @param {boolean} gameLogSource */
function columnDisplayValue(sport, season, value, gameLogSource) {
  if (value != null) return value;
  if ((sport === 'NHL' || BASKETBALL_GAME_LOG_SPORTS.has(sport)) && gameLogSource) return null;
  return season;
}

/** @param {string} teamsUrl @param {string} teamId @param {string} sport */
async function fetchTeamStatsBundle(teamsUrl, teamId, sport) {
  const needsRecord = BASKETBALL_GAME_LOG_SPORTS.has(sport) || sport === 'MLS';
  const isNhl = sport === 'NHL';
  const usesBasketballGameLog = BASKETBALL_GAME_LOG_SPORTS.has(sport);
  const [statsRes, record, nhlRecordSplits, nhlGameTotals, nbaGameTotals] = await Promise.all([
    fetch(`${teamsUrl}/${teamId}/statistics?enable=split`, { headers: FETCH_HEADERS }),
    needsRecord ? fetchTeamRecord(teamsUrl, teamId) : Promise.resolve(null),
    isNhl ? fetchNhlRecordSplits(teamsUrl, teamId) : Promise.resolve(null),
    isNhl ? fetchNhlGameTotals(teamId, teamsUrl) : Promise.resolve(null),
    usesBasketballGameLog ? fetchNbaGameTotals(teamId, teamsUrl) : Promise.resolve(null),
  ]);

  let season = null;
  let home = null;
  let away = null;
  let last7 = null;
  let opponent = null;

  if (statsRes.ok) {
    const data = await statsRes.json();
    const results = data.results ?? {};
    season = results.stats ?? null;
    opponent = results.opponent ?? null;
    const splits = results.splits ?? [];
    home = splits.find((s) => s.name === 'Home') ?? null;
    away = splits.find((s) => s.name === 'Away') ?? null;
    last7 = splits.find((s) => s.name === 'Last 7 Days') ?? null;
  }

  return {
    season,
    home,
    away,
    last7,
    opponent,
    record,
    ...(isNhl ? { nhlRecordSplits, nhlGameTotals } : {}),
    ...(usesBasketballGameLog ? { nbaGameTotals } : {}),
  };
}

/** @param {string} sport @param {() => Promise<object[]>} fetchTeams */
export async function fetchLeagueStatsCache(sport, fetchTeams) {
  const config = ESPN_STAT_LEAGUES[sport];
  if (!config) return new Map();

  const teams = await fetchTeams();
  const entries = await Promise.all(
    teams.map(async (team) => {
      const teamId = team.espn_id ?? team.id;
      const bundle = await fetchTeamStatsBundle(config.teamsUrl, String(teamId), sport);
      return [String(teamId), bundle];
    }),
  );

  return new Map(entries);
}

/** @param {string} sport @param {string} awayTeamId @param {string} homeTeamId @param {Map<string, object>} cache @returns {StatRow[]} */
export function buildMatchStatsFromCache(sport, awayTeamId, homeTeamId, cache) {
  const config = ESPN_STAT_LEAGUES[sport];
  if (!config) return [];

  const away = cache.get(String(awayTeamId));
  const home = cache.get(String(homeTeamId));
  if (!away || !home) return [];

  return config.stats
    .map((def) => {
      const awaySeason = extractStatValue(away, def, 'season');
      const homeSeason = extractStatValue(home, def, 'season');
      if (awaySeason == null || homeSeason == null) return null;

      const awaySplit = columnDisplayValue(
        sport,
        awaySeason,
        extractStatValue(away, def, 'away'),
        !!(def.nhlRecordSplit || def.nbaGameLog),
      );
      const homeSplit = columnDisplayValue(
        sport,
        homeSeason,
        extractStatValue(home, def, 'home'),
        !!(def.nhlRecordSplit || def.nbaGameLog),
      );
      const awayLast5 = columnDisplayValue(
        sport,
        awaySeason,
        extractStatValue(away, def, 'last7'),
        !!(def.nhlLast5 || def.nbaGameLog),
      );
      const homeLast5 = columnDisplayValue(
        sport,
        homeSeason,
        extractStatValue(home, def, 'last7'),
        !!(def.nhlLast5 || def.nbaGameLog),
      );

      return {
        id: def.id,
        label: def.label,
        awaySeason,
        awaySplit,
        awayLast5,
        awayL5Rank: computeRank(cache, def, 'last7', String(awayTeamId)),
        homeSeason,
        homeSplit,
        homeLast5,
        homeL5Rank: computeRank(cache, def, 'last7', String(homeTeamId)),
        awayAdvantage: compareAdvantage(
          awayLast5 ?? awaySeason,
          homeLast5 ?? homeSeason,
          def.lowerIsBetter,
        ),
        format: def.format,
      };
    })
    .filter(Boolean);
}

/** @param {string} sport @param {object} row @param {Map<string, object>} cache */
export function attachStatsToRow(sport, row, cache) {
  const awayId = row.away_team?.id;
  const homeId = row.home_team?.id;
  if (!awayId || !homeId) return row;
  const stats = buildMatchStatsFromCache(sport, awayId, homeId, cache);
  return stats.length > 0 ? { ...row, stats } : row;
}
