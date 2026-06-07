import type { Sport, StatRow } from '../types';
import { ESPN_CACHED_SPORTS, type EspnCachedSport } from './espnLeagues';
import {
  extractNbaGameTotalsValue,
  fetchNbaGameTotals,
  type NbaGameStatKind,
  type NbaGameTotals,
} from './espnNbaGameTotals';
import {
  extractFootballGameTotalsValue,
  fetchFootballGameTotals,
  type FootballGameTotals,
} from './espnFootballGameTotals';
import {
  extractNhlGameTotalsValue,
  extractNhlRecordSplitValue,
  fetchNhlGameTotals,
  fetchNhlRecordSplits,
  type NhlGameStatKind,
  type NhlGameTotals,
  type NhlRecordSplits,
} from './espnNhlSplits';
import { FOOTBALL_STAT_DEFS, type FootballGameStatKind } from './footballStatDefs';

type StatFormat = StatRow['format'];

type StatDef = {
  id: string;
  label: string;
  category?: string;
  name?: string;
  recordName?: string;
  recordGp?: string;
  format?: StatFormat;
  scale?: number;
  perGame?: boolean;
  opponent?: boolean;
  lowerIsBetter?: boolean;
  /** NHL home/road record field (ESPN has no team stat splits for hockey). */
  nhlRecordSplit?: 'avgPointsFor' | 'avgPointsAgainst' | 'powerPlayGoalsPerGame';
  /** NHL per-game aggregate from schedule + box scores (season, home, road, last 5). */
  nhlLast5?: NhlGameStatKind;
  /** Pro/college basketball per-game aggregate from schedule game logs (season, home, road, last 5). */
  nbaGameLog?: NbaGameStatKind;
  /** Pro/college football per-game aggregate from schedule game logs (season, home, road, last 3). */
  footballGameLog?: FootballGameStatKind;
};

const BASKETBALL_GAME_LOG_SPORTS: ReadonlySet<EspnCachedSport> = new Set([
  'NBA',
  'WNBA',
  'NCAAB',
  'NCAAW',
]);

const FOOTBALL_GAME_LOG_SPORTS: ReadonlySet<EspnCachedSport> = new Set(['NFL', 'NCAAF']);

const BASKETBALL_STAT_DEFS: StatDef[] = [
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

type StatCategory = {
  name: string;
  stats?: Array<{ name: string; value?: number; perGameValue?: number }>;
};

type StatBlock = {
  categories?: StatCategory[];
};

type TeamStatsBundle = {
  season: StatBlock | null;
  home: StatBlock | null;
  away: StatBlock | null;
  last7: StatBlock | null;
  opponent: StatCategory[] | null;
  record: Record<string, number> | null;
  nhlRecordSplits?: NhlRecordSplits | null;
  nhlGameTotals?: NhlGameTotals | null;
  nbaGameTotals?: NbaGameTotals | null;
  footballGameTotals?: FootballGameTotals | null;
};

type LeagueStatConfig = {
  sport: EspnCachedSport;
  teamsUrl: string;
  stats: StatDef[];
};

const FETCH_HEADERS = {
  Accept: 'application/json',
};

const ESPN_STAT_LEAGUES: Record<EspnCachedSport, LeagueStatConfig> = {
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
    stats: FOOTBALL_STAT_DEFS,
  },
  NCAAF: {
    sport: 'NCAAF',
    teamsUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
    stats: FOOTBALL_STAT_DEFS,
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

const leagueCache = new Map<EspnCachedSport, { at: number; data: Map<string, TeamStatsBundle> }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function findStat(
  block: StatBlock | StatCategory[] | null,
  categoryName: string,
  statName: string,
) {
  if (!block) return null;
  if (Array.isArray(block)) {
    const category = block.find((c) => c.name === categoryName);
    return category?.stats?.find((s) => s.name === statName) ?? null;
  }
  const category = block.categories?.find((c) => c.name === categoryName);
  return category?.stats?.find((s) => s.name === statName) ?? null;
}

function extractStatValue(
  bundle: TeamStatsBundle,
  def: StatDef,
  split: 'season' | 'home' | 'away' | 'last7',
): number | null {
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
  if (def.footballGameLog && bundle.footballGameTotals) {
    const value = extractFootballGameTotalsValue(
      bundle.footballGameTotals,
      split,
      def.footballGameLog,
    );
    if (value != null) return value;
  }

  if (def.recordName) {
    const raw = bundle.record?.[def.recordName];
    if (raw == null || Number.isNaN(Number(raw))) return null;
    let num = Number(raw);
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
  const stat = findStat(sourceBlock, def.category!, def.name!);
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

function compareAdvantage(away: number, home: number, lowerIsBetter?: boolean): boolean | null {
  const diff = away - home;
  if (Math.abs(diff) < 0.0001) return null;
  if (lowerIsBetter) return away < home;
  return away > home;
}

function computeRank(
  cache: Map<string, TeamStatsBundle>,
  def: StatDef,
  teamId: string,
): number {
  const values: Array<{ id: string; value: number }> = [];
  for (const [id, bundle] of cache) {
    const value = extractStatValue(bundle, def, 'last7') ?? extractStatValue(bundle, def, 'season');
    if (value != null) values.push({ id, value });
  }
  if (values.length === 0) return 16;

  values.sort((a, b) => (def.lowerIsBetter ? a.value - b.value : b.value - a.value));
  const index = values.findIndex((v) => v.id === teamId);
  return index >= 0 ? index + 1 : Math.ceil(values.length / 2);
}

async function fetchTeamRecord(
  teamsUrl: string,
  teamId: string,
): Promise<Record<string, number> | null> {
  const res = await fetch(`${teamsUrl}/${teamId}`, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  const items = data.team?.record?.items ?? [];
  const overall = items.find((i: { type?: string }) => i.type === 'total') ?? items[0];
  if (!overall?.stats) return null;
  return Object.fromEntries(
    overall.stats.map((s: { name: string; value: number }) => [s.name, s.value]),
  );
}

async function fetchTeamStatsBundle(
  teamsUrl: string,
  teamId: string,
  sport: EspnCachedSport,
): Promise<TeamStatsBundle> {
  const needsRecord = BASKETBALL_GAME_LOG_SPORTS.has(sport) || sport === 'MLS';
  const isNhl = sport === 'NHL';
  const usesBasketballGameLog = BASKETBALL_GAME_LOG_SPORTS.has(sport);
  const usesFootballGameLog = FOOTBALL_GAME_LOG_SPORTS.has(sport);
  const [statsRes, record, nhlRecordSplits, nhlGameTotals, nbaGameTotals, footballGameTotals] =
    await Promise.all([
      fetch(`${teamsUrl}/${teamId}/statistics?enable=split`, { headers: FETCH_HEADERS }),
      needsRecord ? fetchTeamRecord(teamsUrl, teamId) : Promise.resolve(null),
      isNhl ? fetchNhlRecordSplits(teamsUrl, teamId) : Promise.resolve(null),
      isNhl ? fetchNhlGameTotals(teamId, teamsUrl) : Promise.resolve(null),
      usesBasketballGameLog ? fetchNbaGameTotals(teamId, teamsUrl) : Promise.resolve(null),
      usesFootballGameLog ? fetchFootballGameTotals(teamId, teamsUrl) : Promise.resolve(null),
    ]);

  let season: StatBlock | null = null;
  let home: StatBlock | null = null;
  let away: StatBlock | null = null;
  let last7: StatBlock | null = null;
  let opponent: StatCategory[] | null = null;

  if (statsRes.ok) {
    const data = await statsRes.json();
    const results = data.results ?? {};
    season = results.stats ?? null;
    opponent = results.opponent ?? null;
    const splits: Array<{ name: string } & StatBlock> = results.splits ?? [];
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
    ...(usesFootballGameLog ? { footballGameTotals } : {}),
  };
}

function columnDisplayValue(
  sport: EspnCachedSport,
  season: number,
  value: number | null,
  gameLogSource: boolean,
): number | null {
  if (value != null) return value;
  if (
    (sport === 'NHL' ||
      BASKETBALL_GAME_LOG_SPORTS.has(sport) ||
      FOOTBALL_GAME_LOG_SPORTS.has(sport)) &&
    gameLogSource
  ) {
    return null;
  }
  return season;
}

async function fetchLeagueStatsCache(sport: EspnCachedSport): Promise<Map<string, TeamStatsBundle>> {
  const cached = leagueCache.get(sport);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  const config = ESPN_STAT_LEAGUES[sport];
  const teamLimit =
    sport === 'NCAAB' || sport === 'NCAAW' || sport === 'NCAAF' ? 500 : 100;
  const teamsRes = await fetch(`${config.teamsUrl}?limit=${teamLimit}`, { headers: FETCH_HEADERS });
  if (!teamsRes.ok) {
    throw new Error(`ESPN ${sport} teams failed: ${teamsRes.status}`);
  }

  const teamsData = await teamsRes.json();
  const entries = teamsData.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const bundles = await Promise.all(
    entries.map(async (entry: { team: { id: string } }) => {
      const teamId = String(entry.team.id);
      const bundle = await fetchTeamStatsBundle(config.teamsUrl, teamId, sport);
      return [teamId, bundle] as const;
    }),
  );

  const data = new Map<string, TeamStatsBundle>(bundles);
  leagueCache.set(sport, { at: Date.now(), data });
  return data;
}

function buildMatchStatsFromCache(
  sport: EspnCachedSport,
  awayTeamId: string,
  homeTeamId: string,
  cache: Map<string, TeamStatsBundle>,
): StatRow[] {
  const config = ESPN_STAT_LEAGUES[sport];
  const away = cache.get(awayTeamId);
  const home = cache.get(homeTeamId);
  if (!away || !home) return [];

  const rows: StatRow[] = [];
  for (const def of config.stats) {
    const awaySeason = extractStatValue(away, def, 'season');
    const homeSeason = extractStatValue(home, def, 'season');
    if (awaySeason == null || homeSeason == null) continue;

    const awaySplitRaw = extractStatValue(away, def, 'away');
    const homeSplitRaw = extractStatValue(home, def, 'home');
    const awayLast5Raw = extractStatValue(away, def, 'last7');
    const homeLast5Raw = extractStatValue(home, def, 'last7');

    const awaySplit = columnDisplayValue(
      sport,
      awaySeason,
      awaySplitRaw,
      !!(def.nhlRecordSplit || def.nbaGameLog || def.footballGameLog),
    );
    const homeSplit = columnDisplayValue(
      sport,
      homeSeason,
      homeSplitRaw,
      !!(def.nhlRecordSplit || def.nbaGameLog || def.footballGameLog),
    );
    const awayLast5 = columnDisplayValue(
      sport,
      awaySeason,
      awayLast5Raw,
      !!(def.nhlLast5 || def.nbaGameLog || def.footballGameLog),
    );
    const homeLast5 = columnDisplayValue(
      sport,
      homeSeason,
      homeLast5Raw,
      !!(def.nhlLast5 || def.nbaGameLog || def.footballGameLog),
    );

    rows.push({
      id: def.id,
      label: def.label,
      awaySeason,
      awaySplit,
      awayLast5,
      awayL5Rank: computeRank(cache, def, awayTeamId),
      homeSeason,
      homeSplit,
      homeLast5,
      homeL5Rank: computeRank(cache, def, homeTeamId),
      awayAdvantage: compareAdvantage(
        awayLast5 ?? awaySeason,
        homeLast5 ?? homeSeason,
        def.lowerIsBetter,
      ),
      ...(def.format ? { format: def.format } : {}),
    });
  }
  return rows;
}

export async function fetchEspnMatchStats(
  sport: Sport,
  awayTeamId: string,
  homeTeamId: string,
): Promise<StatRow[]> {
  if (!(sport in ESPN_CACHED_SPORTS)) return [];
  const espnSport = sport as EspnCachedSport;
  const cache = await fetchLeagueStatsCache(espnSport);
  return buildMatchStatsFromCache(espnSport, awayTeamId, homeTeamId, cache);
}
