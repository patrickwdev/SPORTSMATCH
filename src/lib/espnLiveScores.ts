import type { GameStatus, Match, Sport } from '../types';
import { mapEspnGameStatus, parseEspnScore } from '../utils/gameStatus';
import { addDaysToIso, toISODateEastern, toISODateLocal } from '../utils/dates';
import { isEspnCachedSport, type EspnCachedSport } from './espnLeagues';

const FETCH_HEADERS = { Accept: 'application/json' };

export type LiveScoreUpdate = {
  gameStatus: GameStatus;
  statusDetail: string | null;
  awayScore: number | null;
  homeScore: number | null;
};

const SCOREBOARD_CONFIG: Record<EspnCachedSport, { url: string; idPrefix: string }> = {
  NFL: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    idPrefix: 'espn-nfl',
  },
  NCAAF: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    idPrefix: 'espn-ncaaf',
  },
  MLB: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    idPrefix: 'espn',
  },
  NBA: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    idPrefix: 'espn-nba',
  },
  NHL: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    idPrefix: 'espn-nhl',
  },
  MLS: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
    idPrefix: 'espn-mls',
  },
  WNBA: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    idPrefix: 'espn-wnba',
  },
  NCAAB: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    idPrefix: 'espn-ncaab',
  },
  NCAAW: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard',
    idPrefix: 'espn-ncaaw',
  },
};

type EspnCompetitor = { homeAway?: string; score?: unknown };
type EspnEvent = {
  id?: string;
  competitions?: Array<{
    status?: { type?: { name?: string; shortDetail?: string; detail?: string; description?: string } };
    competitors?: EspnCompetitor[];
  }>;
};

function parseEvent(event: EspnEvent, idPrefix: string): LiveScoreUpdate & { matchId: string; eventId: string } | null {
  const competition = event.competitions?.[0];
  if (!competition || !event.id) return null;

  const competitors = competition.competitors ?? [];
  const away = competitors.find((c) => c.homeAway === 'away');
  const home = competitors.find((c) => c.homeAway === 'home');
  if (!away || !home) return null;

  const statusType = competition.status?.type ?? {};
  const statusName = statusType.name ?? '';
  const gameStatus = mapEspnGameStatus(statusName);
  const statusDetail =
    statusType.shortDetail ?? statusType.detail ?? statusType.description ?? null;

  const awayScore = parseEspnScore(away.score);
  const homeScore = parseEspnScore(home.score);
  const isNotStarted =
    gameStatus === 'scheduled' ||
    statusName === 'STATUS_SCHEDULED' ||
    statusName === 'STATUS_NOT_STARTED' ||
    statusName === 'STATUS_PREVIEW';
  const hasScore =
    awayScore !== null &&
    homeScore !== null &&
    !isNotStarted &&
    (gameStatus === 'final' ||
      gameStatus === 'in_progress' ||
      gameStatus === 'delayed' ||
      gameStatus === 'suspended' ||
      gameStatus === 'unknown');

  return {
    matchId: `${idPrefix}-${event.id}`,
    eventId: String(event.id),
    gameStatus,
    statusDetail,
    awayScore: hasScore ? awayScore : null,
    homeScore: hasScore ? homeScore : null,
  };
}

async function fetchScoreboardUpdates(
  sport: EspnCachedSport,
  isoDate: string,
): Promise<Map<string, LiveScoreUpdate>> {
  const { url, idPrefix } = SCOREBOARD_CONFIG[sport];
  const dateParam = isoDate.replace(/-/g, '');
  const res = await fetch(`${url}?dates=${dateParam}&limit=200`, { headers: FETCH_HEADERS });
  if (!res.ok) return new Map();

  const data = (await res.json()) as { events?: EspnEvent[] };
  const map = new Map<string, LiveScoreUpdate>();
  for (const event of data.events ?? []) {
    const parsed = parseEvent(event, idPrefix);
    if (!parsed) continue;
    const { matchId, eventId, ...update } = parsed;
    map.set(matchId, update);
    map.set(eventId, update);
  }
  return map;
}

/** Scoreboard dates to fetch — includes adjacent days for late West Coast starts (ET calendar). */
export function datesForLiveScoreRefresh(matches: Match[], sport?: Sport): string[] {
  const today = sport && isEspnCachedSport(sport) ? toISODateEastern() : toISODateLocal(new Date());
  const dates = new Set<string>([today, addDaysToIso(today, -1), addDaysToIso(today, 1)]);
  for (let i = 2; i <= 14; i++) {
    dates.add(addDaysToIso(today, -i));
  }
  for (const m of matches) {
    if (m.gameDate) dates.add(m.gameDate);
  }

  return [...dates].sort();
}

export async function fetchLiveScoreUpdates(
  sport: EspnCachedSport,
  dates: string[],
): Promise<Map<string, LiveScoreUpdate>> {
  const merged = new Map<string, LiveScoreUpdate>();
  const uniqueDates = [...new Set(dates)];
  await Promise.all(
    uniqueDates.map(async (isoDate) => {
      const dayMap = await fetchScoreboardUpdates(sport, isoDate);
      for (const [key, value] of dayMap) {
        merged.set(key, value);
      }
    }),
  );
  return merged;
}

function pickScore(
  updateScore: number | null | undefined,
  currentScore: number | null | undefined,
): number | null | undefined {
  if (updateScore != null) return updateScore;
  return currentScore;
}

export function applyLiveScores(matches: Match[], updates: Map<string, LiveScoreUpdate>): Match[] {
  if (updates.size === 0) return matches;
  return matches.map((match) => {
    const update =
      (match.espnEventId ? updates.get(match.espnEventId) : undefined) ?? updates.get(match.id);
    if (!update) return match;

    const awayScore = pickScore(update.awayScore, match.awayScore);
    const homeScore = pickScore(update.homeScore, match.homeScore);
    let gameStatus = update.gameStatus ?? match.gameStatus;
    if (
      gameStatus === 'unknown' &&
      awayScore != null &&
      homeScore != null &&
      match.gameStatus !== 'in_progress'
    ) {
      gameStatus = 'final';
    }

    const isFinal = gameStatus === 'final';
    return {
      ...match,
      gameStatus,
      statusDetail: isFinal
        ? (update.statusDetail ?? match.statusDetail ?? 'Final')
        : (update.statusDetail ?? match.statusDetail),
      awayScore,
      homeScore,
    };
  });
}

export async function enrichMatchesWithLiveScores(
  sport: EspnCachedSport,
  matches: Match[],
): Promise<Match[]> {
  try {
    const dates = datesForLiveScoreRefresh(matches, sport);
    const updates = await fetchLiveScoreUpdates(sport, dates);
    return applyLiveScores(matches, updates);
  } catch {
    return matches;
  }
}

export async function enrichMatchWithLiveScore(match: Match): Promise<Match> {
  if (!match.espnEventId || !isEspnCachedSport(match.sport)) return match;
  try {
    const updates = await fetchLiveScoreUpdates(
      match.sport,
      datesForLiveScoreRefresh([match], match.sport),
    );
    return applyLiveScores([match], updates)[0];
  } catch {
    return match;
  }
}
