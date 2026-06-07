import type {
  GameResultLetter,
  HeadToHeadGame,
  HeadToHeadRecord,
  Match,
  MatchHistory,
  TeamRecentGame,
  TeamRecentSummary,
} from '../types';
import { ESPN_CACHED_SPORTS, type EspnCachedSport } from './espnLeagues';
import {
  fetchTeamScheduleHistory,
  parseScheduleScore,
  scheduleGameResult,
  type ScheduleEvent,
} from './espnStreak';

const FETCH_HEADERS = { Accept: 'application/json' };
const ESPN_GAME_DATE_TZ = 'America/New_York';
const RECENT_LIMIT = 10;
const HEAD_TO_HEAD_LIMIT = 10;

const TEAMS_URL: Record<EspnCachedSport, string> = {
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
  NCAAF: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
  MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
  MLS: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams',
  WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams',
  NCAAB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams',
  NCAAW: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams',
};

type ScheduleTeam = {
  id?: string;
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  logos?: Array<{ href?: string }>;
};

function formatGameDate(isoDate: string | undefined): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: ESPN_GAME_DATE_TZ });
  const day = date.toLocaleDateString('en-US', { day: '2-digit', timeZone: ESPN_GAME_DATE_TZ });
  const year = date.toLocaleDateString('en-US', { year: '2-digit', timeZone: ESPN_GAME_DATE_TZ });
  return `${month} ${day}, '${year}`;
}

function opponentAbbreviation(team?: ScheduleTeam): string {
  return team?.abbreviation ?? team?.shortDisplayName ?? team?.displayName ?? '—';
}

function opponentLogoUrl(team?: ScheduleTeam): string | undefined {
  return team?.logos?.[0]?.href;
}

function parseTeamRecentGame(event: ScheduleEvent, teamId: string): TeamRecentGame | null {
  const comp = event.competitions[0];
  const us = comp?.competitors?.find((c) => String(c.team?.id) === teamId);
  const them = comp?.competitors?.find((c) => String(c.team?.id) !== teamId);
  if (!us || !them) return null;

  const result = scheduleGameResult(us, them);
  if (!result) return null;

  const usScore = parseScheduleScore(us.score);
  const themScore = parseScheduleScore(them.score);
  const themTeam = them.team as ScheduleTeam | undefined;

  return {
    date: formatGameDate(event.date),
    result,
    usScore,
    themScore,
    score: `${usScore}-${themScore}`,
    opponentAbbreviation: opponentAbbreviation(themTeam),
    opponentLogoUrl: opponentLogoUrl(themTeam),
    venue: us.homeAway === 'home' ? 'H' : 'A',
  };
}

function formatMoneyLine(value: number | undefined): string | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Math.round(Number(value));
  return n > 0 ? `+${n}` : String(n);
}

function profitFromAmericanOdds(odds: number, stake = 100): number {
  if (odds > 0) return (odds / 100) * stake;
  return (100 / Math.abs(odds)) * stake;
}

function formatProfit(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '$0';
  return rounded > 0 ? `$${rounded}` : `-$${Math.abs(rounded)}`;
}

function computeRecentSummary(games: TeamRecentGame[]): TeamRecentSummary {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let overs = 0;
  let unders = 0;
  let pushes = 0;
  let mlProfit = 0;

  for (const game of games) {
    if (game.result === 'W') wins += 1;
    else if (game.result === 'L') losses += 1;
    else ties += 1;

    if (game.ouResult === 'o') overs += 1;
    else if (game.ouResult === 'u') unders += 1;
    else if (game.ouResult === 'p') pushes += 1;

    if (game.moneyLine && game.mlResult) {
      const odds = Number.parseInt(game.moneyLine, 10);
      if (!Number.isNaN(odds)) {
        if (game.mlResult === 'W') mlProfit += profitFromAmericanOdds(odds);
        else if (game.mlResult === 'L') mlProfit -= 100;
      }
    }
  }

  const tieSuffix = ties > 0 ? `-${ties}` : '';
  return {
    winLoss: `${wins}-${losses}${tieSuffix}`,
    overUnder: `${overs}-${unders}-${pushes}`,
    mlProfit: formatProfit(mlProfit),
  };
}

type MlbSummary = {
  pickcenter?: Array<{
    overUnder?: number;
    awayTeamOdds?: { moneyLine?: number; teamId?: string };
    homeTeamOdds?: { moneyLine?: number; teamId?: string };
  }>;
  boxscore?: {
    players?: Array<{
      team?: { id?: string };
      statistics?: Array<{
        type?: string;
        athletes?: Array<{
          starter?: boolean;
          athlete?: { shortName?: string; displayName?: string };
          stats?: string[];
        }>;
      }>;
    }>;
  };
};

function findStartingPitcher(
  summary: MlbSummary,
  teamId: string,
): { name: string; ip: string } | null {
  const side = summary.boxscore?.players?.find((p) => String(p.team?.id) === teamId);
  const pitching = side?.statistics?.find((s) => s.type === 'pitching');
  const starter =
    pitching?.athletes?.find((a) => a.starter) ?? pitching?.athletes?.[0];
  if (!starter) return null;
  const name = starter.athlete?.shortName ?? starter.athlete?.displayName ?? '—';
  const ip = starter.stats?.[0] ?? '—';
  return { name, ip };
}

async function enrichMlbRecentGame(
  game: TeamRecentGame,
  eventId: string,
  teamId: string,
  opponentId: string,
  summaryBaseUrl: string,
): Promise<TeamRecentGame> {
  try {
    const res = await fetch(`${summaryBaseUrl}/summary?event=${eventId}`, {
      headers: FETCH_HEADERS,
    });
    if (!res.ok) return game;
    const summary = (await res.json()) as MlbSummary;
    const pick = summary.pickcenter?.[0];
    const teamOdds =
      String(pick?.awayTeamOdds?.teamId) === teamId
        ? pick?.awayTeamOdds
        : pick?.homeTeamOdds;
    const moneyLine = formatMoneyLine(teamOdds?.moneyLine);
    const mlResult = moneyLine ? game.result : null;

    let overUnderLine: string | null = null;
    let ouResult: TeamRecentGame['ouResult'] = null;
    if (pick?.overUnder != null) {
      const total = game.usScore + game.themScore;
      const line = Number(pick.overUnder);
      overUnderLine = Number.isInteger(line) ? `${line}.0` : String(line);
      if (total > line) ouResult = 'o';
      else if (total < line) ouResult = 'u';
      else ouResult = 'p';
    }

    const starter = findStartingPitcher(summary, teamId);
    const oppStarter = findStartingPitcher(summary, opponentId);

    return {
      ...game,
      moneyLine,
      mlResult,
      overUnderLine,
      ouResult,
      starterName: starter?.name ?? null,
      starterIp: starter?.ip ?? null,
      oppStarterName: oppStarter?.name ?? null,
      oppStarterIp: oppStarter?.ip ?? null,
    };
  } catch {
    return game;
  }
}

async function recentGamesFromEvents(
  events: ScheduleEvent[],
  teamId: string,
  sport: EspnCachedSport,
  teamsUrl: string,
): Promise<TeamRecentGame[]> {
  const pairs: Array<{ event: ScheduleEvent; game: TeamRecentGame }> = [];
  for (let i = events.length - 1; i >= 0 && pairs.length < RECENT_LIMIT; i--) {
    const parsed = parseTeamRecentGame(events[i], teamId);
    if (parsed) pairs.push({ event: events[i], game: parsed });
  }

  if (sport !== 'MLB') {
    return pairs.map((p) => p.game);
  }

  const summaryBase = teamsUrl.replace('/teams', '');
  return Promise.all(
    pairs.map(async ({ event, game }) => {
      const comp = event.competitions[0];
      const opponentId = String(
        comp?.competitors?.find((c) => String(c.team?.id) !== teamId)?.team?.id ?? '',
      );
      if (!event.id || !opponentId) return game;
      return enrichMlbRecentGame(game, event.id, teamId, opponentId, summaryBase);
    }),
  );
}

function parseHeadToHeadGame(event: ScheduleEvent): HeadToHeadGame | null {
  const comp = event.competitions[0];
  const away = comp?.competitors?.find((c) => c.homeAway === 'away');
  const home = comp?.competitors?.find((c) => c.homeAway === 'home');
  if (!away || !home) return null;

  const awayScore = parseScheduleScore(away.score);
  const homeScore = parseScheduleScore(home.score);
  let winnerSide: HeadToHeadGame['winnerSide'] = 'tie';
  if (awayScore > homeScore) winnerSide = 'away';
  else if (homeScore > awayScore) winnerSide = 'home';

  return {
    date: formatGameDate(event.date),
    awayAbbreviation: opponentAbbreviation(away.team as ScheduleTeam),
    homeAbbreviation: opponentAbbreviation(home.team as ScheduleTeam),
    homeLogoUrl: opponentLogoUrl(home.team as ScheduleTeam),
    awayScore,
    homeScore,
    winnerSide,
  };
}

async function enrichMlbHeadToHeadGame(
  game: HeadToHeadGame,
  eventId: string,
  eventAwayTeamId: string,
  matchAwayTeamId: string,
  matchHomeTeamId: string,
  summaryBaseUrl: string,
): Promise<HeadToHeadGame> {
  try {
    const res = await fetch(`${summaryBaseUrl}/summary?event=${eventId}`, {
      headers: FETCH_HEADERS,
    });
    if (!res.ok) return game;
    const summary = (await res.json()) as MlbSummary;
    const pick = summary.pickcenter?.[0];
    const matchAwayWasEventAway = eventAwayTeamId === matchAwayTeamId;
    const matchAwayOdds = matchAwayWasEventAway ? pick?.awayTeamOdds : pick?.homeTeamOdds;
    const moneyLine = formatMoneyLine(matchAwayOdds?.moneyLine);

    const matchAwayWon =
      game.winnerSide === 'tie'
        ? null
        : (game.winnerSide === 'away' && matchAwayWasEventAway) ||
          (game.winnerSide === 'home' && !matchAwayWasEventAway);
    const mlResult: GameResultLetter | null =
      moneyLine == null || matchAwayWon == null
        ? null
        : matchAwayWon
          ? 'W'
          : 'L';

    let overUnderLine: string | null = null;
    let ouResult: HeadToHeadGame['ouResult'] = null;
    if (pick?.overUnder != null) {
      const total = game.awayScore + game.homeScore;
      const line = Number(pick.overUnder);
      overUnderLine = Number.isInteger(line) ? `${line}.0` : String(line);
      if (total > line) ouResult = 'o';
      else if (total < line) ouResult = 'u';
      else ouResult = 'p';
    }

    const matchAwayStarter = findStartingPitcher(summary, matchAwayTeamId);
    const matchHomeStarter = findStartingPitcher(summary, matchHomeTeamId);

    return {
      ...game,
      awayMoneyLine: moneyLine,
      awayMlResult: mlResult,
      overUnderLine,
      ouResult,
      matchAwayStarterName: matchAwayStarter?.name ?? null,
      matchAwayStarterIp: matchAwayStarter?.ip ?? null,
      matchHomeStarterName: matchHomeStarter?.name ?? null,
      matchHomeStarterIp: matchHomeStarter?.ip ?? null,
    };
  } catch {
    return game;
  }
}

async function headToHeadFromEvents(
  events: ScheduleEvent[],
  sport: EspnCachedSport,
  teamsUrl: string,
  matchAwayTeamId: string,
  matchHomeTeamId: string,
): Promise<HeadToHeadGame[]> {
  const pairs: Array<{ event: ScheduleEvent; game: HeadToHeadGame }> = [];
  for (const event of events) {
    const parsed = parseHeadToHeadGame(event);
    if (parsed) pairs.push({ event, game: parsed });
  }

  if (sport !== 'MLB') {
    return pairs.map((p) => p.game);
  }

  const summaryBase = teamsUrl.replace('/teams', '');
  return Promise.all(
    pairs.map(async ({ event, game }) => {
      const comp = event.competitions[0];
      const eventAwayTeamId = String(
        comp?.competitors?.find((c) => c.homeAway === 'away')?.team?.id ?? '',
      );
      if (!event.id || !eventAwayTeamId) return game;
      return enrichMlbHeadToHeadGame(
        game,
        event.id,
        eventAwayTeamId,
        matchAwayTeamId,
        matchHomeTeamId,
        summaryBase,
      );
    }),
  );
}

function headToHeadRecordForMatch(
  games: HeadToHeadGame[],
  matchAwayAbbreviation: string,
): HeadToHeadRecord {
  let awayWins = 0;
  let homeWins = 0;
  let ties = 0;

  for (const game of games) {
    if (game.winnerSide === 'tie') {
      ties += 1;
      continue;
    }
    const matchAwayWon =
      (game.winnerSide === 'away' && game.awayAbbreviation === matchAwayAbbreviation) ||
      (game.winnerSide === 'home' && game.homeAbbreviation === matchAwayAbbreviation);
    if (matchAwayWon) awayWins += 1;
    else homeWins += 1;
  }

  return { awayWins, homeWins, ties };
}

function computeHeadToHeadSummary(
  games: HeadToHeadGame[],
  record: HeadToHeadRecord,
): TeamRecentSummary {
  const tieSuffix = record.ties > 0 ? `-${record.ties}` : '';
  let overs = 0;
  let unders = 0;
  let pushes = 0;
  let mlProfit = 0;

  for (const game of games) {
    if (game.ouResult === 'o') overs += 1;
    else if (game.ouResult === 'u') unders += 1;
    else if (game.ouResult === 'p') pushes += 1;

    if (game.awayMoneyLine && game.awayMlResult) {
      const odds = Number.parseInt(game.awayMoneyLine, 10);
      if (!Number.isNaN(odds)) {
        if (game.awayMlResult === 'W') mlProfit += profitFromAmericanOdds(odds);
        else if (game.awayMlResult === 'L') mlProfit -= 100;
      }
    }
  }

  return {
    winLoss: `${record.awayWins}-${record.homeWins}${tieSuffix}`,
    overUnder: `${overs}-${unders}-${pushes}`,
    mlProfit: formatProfit(mlProfit),
  };
}

function eventHasOpponent(event: ScheduleEvent, opponentId: string): boolean {
  return (event.competitions[0]?.competitors ?? []).some(
    (c) => String(c.team?.id) === opponentId,
  );
}

function dedupeEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const byId = new Map<string, ScheduleEvent>();
  for (const event of events) {
    const key =
      event.id ??
      `${event.date ?? ''}-${event.competitions?.[0]?.competitors?.map((c) => c.team?.id).join('-') ?? ''}`;
    byId.set(key, event);
  }
  return [...byId.values()].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

function buildHistory(
  awayRecent: TeamRecentGame[],
  homeRecent: TeamRecentGame[],
  headToHead: HeadToHeadGame[],
  match: Match,
): MatchHistory {
  const headToHeadRecord = headToHeadRecordForMatch(
    headToHead,
    match.awayTeam.abbreviation,
  );
  return {
    awayRecent,
    homeRecent,
    awayRecentSummary: computeRecentSummary(awayRecent),
    homeRecentSummary: computeRecentSummary(homeRecent),
    headToHead,
    headToHeadRecord,
    headToHeadSummary: computeHeadToHeadSummary(headToHead, headToHeadRecord),
  };
}

export async function fetchMatchHistory(match: Match): Promise<MatchHistory | null> {
  if (!(match.sport in ESPN_CACHED_SPORTS)) {
    return null;
  }

  const sport = match.sport as EspnCachedSport;
  const teamsUrl = TEAMS_URL[sport];
  const awayId = match.awayTeam.id;
  const homeId = match.homeTeam.id;

  const [awayEvents, homeEvents] = await Promise.all([
    fetchTeamScheduleHistory(teamsUrl, awayId, sport, {
      minEvents: RECENT_LIMIT,
      maxSeasonsBack: 12,
    }),
    fetchTeamScheduleHistory(teamsUrl, homeId, sport, {
      minEvents: RECENT_LIMIT,
      maxSeasonsBack: 12,
    }),
  ]);

  const [awayRecent, homeRecent] = await Promise.all([
    recentGamesFromEvents(awayEvents, awayId, sport, teamsUrl),
    recentGamesFromEvents(homeEvents, homeId, sport, teamsUrl),
  ]);

  const h2hEvents = dedupeEvents([
    ...awayEvents.filter((event) => eventHasOpponent(event, homeId)),
    ...homeEvents.filter((event) => eventHasOpponent(event, awayId)),
  ]).slice(0, HEAD_TO_HEAD_LIMIT);

  const headToHead = await headToHeadFromEvents(
    h2hEvents,
    sport,
    teamsUrl,
    awayId,
    homeId,
  );

  return buildHistory(awayRecent, homeRecent, headToHead, match);
}

function mockMlbGame(
  date: string,
  result: GameResultLetter,
  usScore: number,
  themScore: number,
  opponentAbbreviation: string,
  venue: 'H' | 'A',
  extras: Partial<TeamRecentGame> = {},
): TeamRecentGame {
  return {
    date,
    result,
    usScore,
    themScore,
    score: `${usScore}-${themScore}`,
    opponentAbbreviation,
    venue,
    mlResult: result,
    ...extras,
  };
}

function mockH2hGame(
  date: string,
  awayAbbreviation: string,
  homeAbbreviation: string,
  awayScore: number,
  homeScore: number,
  matchAwayAbbreviation: string,
  extras: Partial<HeadToHeadGame> = {},
): HeadToHeadGame {
  let winnerSide: HeadToHeadGame['winnerSide'] = 'tie';
  if (awayScore > homeScore) winnerSide = 'away';
  else if (homeScore > awayScore) winnerSide = 'home';

  return {
    date,
    awayAbbreviation,
    homeAbbreviation,
    awayScore,
    homeScore,
    winnerSide,
    ...extras,
  };
}

export function getMockMatchHistory(match: Match): MatchHistory {
  const mlbMock = match.sport === 'MLB';
  const headToHead: HeadToHeadGame[] = mlbMock
    ? [
        mockH2hGame("Jun 02, '26", match.awayTeam.abbreviation, match.homeTeam.abbreviation, 7, 3, match.awayTeam.abbreviation, {
          awayMoneyLine: '-102',
          awayMlResult: 'W',
          overUnderLine: '11.5',
          ouResult: 'u',
          matchAwayStarterName: 'L. Bachar',
          matchAwayStarterIp: '2.2',
          matchHomeStarterName: 'R. Lovelady',
          matchHomeStarterIp: '2.0',
        }),
        mockH2hGame("May 15, '26", match.homeTeam.abbreviation, match.awayTeam.abbreviation, 4, 6, match.awayTeam.abbreviation, {
          awayMoneyLine: '+116',
          awayMlResult: 'W',
          overUnderLine: '9.0',
          ouResult: 'u',
          matchAwayStarterName: 'E. Perez',
          matchAwayStarterIp: '6.0',
          matchHomeStarterName: 'B. Elder',
          matchHomeStarterIp: '5.1',
        }),
        mockH2hGame("Apr 18, '26", match.awayTeam.abbreviation, match.homeTeam.abbreviation, 0, 2, match.awayTeam.abbreviation, {
          awayMoneyLine: '-108',
          awayMlResult: 'L',
          overUnderLine: '8.0',
          ouResult: 'u',
          matchAwayStarterName: 'S. Alcantara',
          matchAwayStarterIp: '6.0',
          matchHomeStarterName: 'M. Gore',
          matchHomeStarterIp: '7.0',
        }),
        mockH2hGame("Sep 12, '25", match.homeTeam.abbreviation, match.awayTeam.abbreviation, 5, 4, match.awayTeam.abbreviation, {
          awayMoneyLine: '+130',
          awayMlResult: 'W',
          overUnderLine: '8.5',
          ouResult: 'o',
          matchAwayStarterName: 'J. Luzardo',
          matchAwayStarterIp: '5.2',
          matchHomeStarterName: 'Z. Wheeler',
          matchHomeStarterIp: '7.0',
        }),
        mockH2hGame("Jul 04, '25", match.awayTeam.abbreviation, match.homeTeam.abbreviation, 3, 5, match.awayTeam.abbreviation, {
          awayMoneyLine: '-125',
          awayMlResult: 'L',
          overUnderLine: '9.0',
          ouResult: 'u',
          matchAwayStarterName: 'L. Bachar',
          matchAwayStarterIp: '4.1',
          matchHomeStarterName: 'R. Lovelady',
          matchHomeStarterIp: '5.0',
        }),
      ]
    : [
        mockH2hGame("Mar 28, '26", match.awayTeam.abbreviation, match.homeTeam.abbreviation, 28, 21, match.awayTeam.abbreviation),
        mockH2hGame("Nov 17, '25", match.homeTeam.abbreviation, match.awayTeam.abbreviation, 20, 27, match.awayTeam.abbreviation),
        mockH2hGame("Jan 21, '25", match.awayTeam.abbreviation, match.homeTeam.abbreviation, 24, 27, match.awayTeam.abbreviation),
      ];
  const awayRecent: TeamRecentGame[] = mlbMock
    ? [
        mockMlbGame("Jun 02, '26", 'W', 7, 3, 'WSH', 'A', {
          moneyLine: '-102',
          overUnderLine: '11.5',
          ouResult: 'u',
          starterName: 'L. Bachar',
          starterIp: '2.2',
          oppStarterName: 'R. Lovelady',
          oppStarterIp: '2.0',
        }),
        mockMlbGame("May 28, '26", 'L', 2, 5, 'NYM', 'H', {
          moneyLine: '+138',
          overUnderLine: '8.5',
          ouResult: 'u',
          starterName: 'S. Alcantara',
          starterIp: '5.0',
          oppStarterName: 'K. Hoglund',
          oppStarterIp: '6.0',
        }),
        mockMlbGame("May 23, '26", 'W', 6, 1, 'ATL', 'A', {
          moneyLine: '+116',
          overUnderLine: '9.0',
          ouResult: 'u',
          starterName: 'E. Perez',
          starterIp: '6.0',
          oppStarterName: 'B. Elder',
          oppStarterIp: '5.1',
        }),
        mockMlbGame("May 18, '26", 'L', 3, 4, 'PHI', 'H', {
          moneyLine: '-145',
          overUnderLine: '7.0',
          ouResult: 'p',
          starterName: 'J. Luzardo',
          starterIp: '5.2',
          oppStarterName: 'Z. Wheeler',
          oppStarterIp: '7.0',
        }),
        mockMlbGame("May 13, '26", 'W', 9, 2, 'TB', 'A', {
          moneyLine: '+105',
          overUnderLine: '8.5',
          ouResult: 'o',
          starterName: 'L. Bachar',
          starterIp: '5.0',
          oppStarterName: 'D. Rasmussen',
          oppStarterIp: '4.1',
        }),
        mockMlbGame("May 08, '26", 'L', 1, 6, 'CIN', 'H', {
          moneyLine: '-118',
          overUnderLine: '9.5',
          ouResult: 'u',
          starterName: 'S. Alcantara',
          starterIp: '4.0',
          oppStarterName: 'F. Montas',
          oppStarterIp: '6.0',
        }),
        mockMlbGame("May 03, '26", 'W', 5, 4, 'MIL', 'A', {
          moneyLine: '+130',
          overUnderLine: '8.0',
          ouResult: 'o',
          starterName: 'E. Perez',
          starterIp: '5.1',
          oppStarterName: 'F. Peralta',
          oppStarterIp: '5.0',
        }),
        mockMlbGame("Apr 28, '26", 'L', 2, 3, 'STL', 'H', {
          moneyLine: '-110',
          overUnderLine: '7.5',
          ouResult: 'u',
          starterName: 'J. Luzardo',
          starterIp: '6.0',
          oppStarterName: 'M. Liberatore',
          oppStarterIp: '5.2',
        }),
        mockMlbGame("Apr 23, '26", 'W', 8, 5, 'COL', 'A', {
          moneyLine: '-135',
          overUnderLine: '10.5',
          ouResult: 'o',
          starterName: 'L. Bachar',
          starterIp: '5.0',
          oppStarterName: 'K. Freeland',
          oppStarterIp: '4.2',
        }),
        mockMlbGame("Apr 18, '26", 'L', 0, 2, 'WSH', 'H', {
          moneyLine: '-108',
          overUnderLine: '8.0',
          ouResult: 'u',
          starterName: 'S. Alcantara',
          starterIp: '6.0',
          oppStarterName: 'M. Gore',
          oppStarterIp: '7.0',
        }),
      ]
    : [
        mockMlbGame("Apr 12, '26", 'W', 28, 24, 'DEN', 'H'),
        mockMlbGame("Apr 05, '26", 'L', 17, 21, 'LV', 'A'),
        mockMlbGame("Mar 29, '26", 'W', 31, 17, 'CIN', 'H'),
        mockMlbGame("Mar 22, '26", 'W', 27, 20, 'LAC', 'A'),
        mockMlbGame("Mar 15, '26", 'L', 20, 24, 'BAL', 'H'),
        mockMlbGame("Mar 08, '26", 'W', 34, 10, 'NE', 'A'),
        mockMlbGame("Mar 01, '26", 'W', 25, 17, 'NYJ', 'H'),
        mockMlbGame("Feb 22, '26", 'L', 14, 19, 'PIT', 'A'),
        mockMlbGame("Feb 15, '26", 'W', 30, 21, 'HOU', 'H'),
        mockMlbGame("Feb 08, '26", 'W', 23, 16, 'TEN', 'A'),
      ];

  const homeRecent: TeamRecentGame[] = mlbMock
    ? [
        mockMlbGame("Jun 02, '26", 'L', 3, 7, 'MIA', 'H', {
          moneyLine: '+102',
          overUnderLine: '11.5',
          ouResult: 'u',
          starterName: 'R. Lovelady',
          starterIp: '2.0',
          oppStarterName: 'L. Bachar',
          oppStarterIp: '2.2',
        }),
        mockMlbGame("May 27, '26", 'W', 4, 2, 'NYM', 'A', {
          moneyLine: '-125',
          overUnderLine: '8.0',
          ouResult: 'u',
          starterName: 'M. Gore',
          starterIp: '6.0',
          oppStarterName: 'K. Hoglund',
          oppStarterIp: '5.0',
        }),
        mockMlbGame("May 22, '26", 'L', 1, 6, 'ATL', 'H', {
          moneyLine: '+140',
          overUnderLine: '9.0',
          ouResult: 'u',
          starterName: 'J. Irvin',
          starterIp: '4.1',
          oppStarterName: 'B. Elder',
          oppStarterIp: '6.0',
        }),
        mockMlbGame("May 17, '26", 'W', 5, 3, 'PHI', 'A', {
          moneyLine: '+118',
          overUnderLine: '7.5',
          ouResult: 'o',
          starterName: 'M. Gore',
          starterIp: '6.0',
          oppStarterName: 'Z. Wheeler',
          oppStarterIp: '7.0',
        }),
        mockMlbGame("May 12, '26", 'L', 2, 9, 'TB', 'H', {
          moneyLine: '-132',
          overUnderLine: '8.5',
          ouResult: 'o',
          starterName: 'R. Lovelady',
          starterIp: '3.2',
          oppStarterName: 'D. Rasmussen',
          oppStarterIp: '5.0',
        }),
        mockMlbGame("May 07, '26", 'W', 6, 1, 'CIN', 'A', {
          moneyLine: '+108',
          overUnderLine: '9.5',
          ouResult: 'u',
          starterName: 'J. Irvin',
          starterIp: '6.0',
          oppStarterName: 'F. Montas',
          oppStarterIp: '5.0',
        }),
        mockMlbGame("May 02, '26", 'L', 4, 5, 'MIL', 'H', {
          moneyLine: '-115',
          overUnderLine: '8.0',
          ouResult: 'o',
          starterName: 'M. Gore',
          starterIp: '5.1',
          oppStarterName: 'F. Peralta',
          oppStarterIp: '6.0',
        }),
        mockMlbGame("Apr 27, '26", 'W', 3, 2, 'STL', 'A', {
          moneyLine: '+122',
          overUnderLine: '7.5',
          ouResult: 'u',
          starterName: 'R. Lovelady',
          starterIp: '5.0',
          oppStarterName: 'M. Liberatore',
          oppStarterIp: '5.2',
        }),
        mockMlbGame("Apr 22, '26", 'L', 5, 8, 'COL', 'H', {
          moneyLine: '-140',
          overUnderLine: '10.5',
          ouResult: 'o',
          starterName: 'J. Irvin',
          starterIp: '4.0',
          oppStarterName: 'K. Freeland',
          oppStarterIp: '5.0',
        }),
        mockMlbGame("Apr 18, '26", 'W', 2, 0, 'MIA', 'H', {
          moneyLine: '+108',
          overUnderLine: '8.0',
          ouResult: 'u',
          starterName: 'M. Gore',
          starterIp: '7.0',
          oppStarterName: 'S. Alcantara',
          oppStarterIp: '6.0',
        }),
      ]
    : [
        mockMlbGame("Apr 11, '26", 'W', 24, 17, 'MIA', 'H'),
        mockMlbGame("Apr 04, '26", 'W', 27, 10, 'NYJ', 'A'),
        mockMlbGame("Mar 28, '26", 'L', 21, 28, 'KC', 'H'),
        mockMlbGame("Mar 21, '26", 'W', 31, 14, 'NE', 'A'),
        mockMlbGame("Mar 14, '26", 'W', 20, 13, 'CLE', 'H'),
        mockMlbGame("Mar 07, '26", 'L', 17, 24, 'BAL', 'A'),
        mockMlbGame("Feb 28, '26", 'W', 35, 10, 'WAS', 'H'),
        mockMlbGame("Feb 21, '26", 'W', 22, 16, 'IND', 'A'),
        mockMlbGame("Feb 14, '26", 'L', 13, 20, 'PIT', 'H'),
        mockMlbGame("Feb 07, '26", 'W', 26, 19, 'CIN', 'A'),
      ];

  return buildHistory(awayRecent, homeRecent, headToHead, match);
}

export async function loadMatchHistory(match: Match): Promise<MatchHistory> {
  const usesEspnIds = /^\d+$/.test(match.awayTeam.id) && /^\d+$/.test(match.homeTeam.id);
  if (!(match.sport in ESPN_CACHED_SPORTS) || !usesEspnIds) {
    return getMockMatchHistory(match);
  }

  try {
    const live = await fetchMatchHistory(match);
    if (live) return live;
  } catch {
    // Fall back to mock rows when offline or fetch fails.
  }
  return getMockMatchHistory(match);
}

export { computeRecentSummary };
