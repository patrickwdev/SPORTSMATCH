import type { Sport } from '../types';
import { footballSeasonYear, isFootballSport } from '../utils/sport';

/** Completed games — aligned with `mapGameStatus` in espn-schedule. */
const COMPLETED_STATUSES = new Set([
  'STATUS_FINAL',
  'STATUS_FULL_TIME',
  'STATUS_END_OF_GAME',
]);
const REGULAR_SEASON_TYPE = 2;
const POSTSEASON_TYPE = 3;

const FETCH_HEADERS = { Accept: 'application/json' };

export type ScheduleCompetitor = {
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
  };
  score?: unknown;
  winner?: boolean;
  homeAway?: string;
};

export type ScheduleEvent = {
  id?: string;
  date?: string;
  competitions: Array<{
    competitors: ScheduleCompetitor[];
    status?: { type?: { name?: string } };
  }>;
};

function dedupeScheduleEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const byId = new Map<string, ScheduleEvent>();
  for (const event of events) {
    const key = event.id ?? `${event.date ?? ''}-${event.competitions?.[0]?.competitors?.map((c) => c.team?.id).join('-') ?? ''}`;
    byId.set(key, event);
  }
  return [...byId.values()];
}

function sortEventsChronologically(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));
}

export function parseScheduleScore(score: unknown): number {
  if (score == null) return 0;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    return Number.parseInt(String((score as { value: unknown }).value), 10) || 0;
  }
  return Number.parseInt(String(score), 10) || 0;
}

/** Format ESPN streak values or pre-built labels as W3 / L2 / D1. */
export function formatStreakDisplay(value: string | number | null | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '—') return '—';
    const match = trimmed.match(/^([WLD])(\d+)$/i);
    if (match) return `${match[1].toUpperCase()}${match[2]}`;
    const n = Number(trimmed);
    if (!Number.isNaN(n)) return formatStreakNumber(n);
    return trimmed;
  }
  return formatStreakNumber(value);
}

function formatStreakNumber(n: number): string {
  if (n === 0 || Number.isNaN(n)) return '—';
  if (n > 0) return `W${n}`;
  return `L${Math.abs(Math.trunc(n))}`;
}

export function scheduleGameResult(
  us: ScheduleCompetitor,
  them: ScheduleCompetitor,
): 'W' | 'L' | 'T' | null {
  if (us.winner === true) return 'W';
  if (them.winner === true) return 'L';
  const usScore = parseScheduleScore(us.score);
  const themScore = parseScheduleScore(them.score);
  if (usScore > themScore) return 'W';
  if (usScore < themScore) return 'L';
  if (usScore === themScore && (us.score != null || them.score != null)) return 'T';
  if (us.winner === false && them.winner === false) return 'T';
  return null;
}

function streakLabel(result: 'W' | 'L' | 'T', count: number): string {
  const letter = result === 'T' ? 'D' : result;
  return `${letter}${count}`;
}

/** Walk final games oldest→newest; return current run (e.g. W3, L1). */
export function computeStreakFromScheduleEvents(
  events: ScheduleEvent[],
  teamId: string,
): string {
  const results: Array<'W' | 'L' | 'T'> = [];

  for (const event of sortEventsChronologically(events)) {
    const comp = event.competitions[0];
    const us = comp?.competitors?.find((c) => String(c.team?.id) === teamId);
    const them = comp?.competitors?.find((c) => String(c.team?.id) !== teamId);
    if (!us || !them) continue;
    const result = scheduleGameResult(us, them);
    if (result) results.push(result);
  }

  if (results.length === 0) return '—';

  const latest = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] !== latest) break;
    count++;
  }

  return streakLabel(latest, count);
}

function filterFinalEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return events.filter((event) => {
    const status = event.competitions?.[0]?.status?.type?.name ?? '';
    return COMPLETED_STATUSES.has(status);
  });
}

function currentSeasonAnchorYear(sport: Sport): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (isFootballSport(sport)) return footballSeasonYear();
  if (sport === 'MLB' || sport === 'MLS' || sport === 'WNBA') return year;
  return month >= 9 ? year + 1 : year;
}

function scheduleUrlForSeason(
  teamsUrl: string,
  teamId: string,
  sport: Sport,
  seasonYear: number,
  seasonType: number,
): string {
  if (isFootballSport(sport)) {
    return `${teamsUrl}/${teamId}/schedule?season=${seasonYear}&seasontype=${seasonType}`;
  }
  if (sport === 'MLS') {
    if (seasonType === POSTSEASON_TYPE) {
      return `${teamsUrl}/${teamId}/schedule?season=${seasonYear}&seasontype=${POSTSEASON_TYPE}`;
    }
    return `${teamsUrl}/${teamId}/schedule?season=${seasonYear}`;
  }
  return `${teamsUrl}/${teamId}/schedule?season=${seasonYear}&seasontype=${seasonType}`;
}

/** Final games across recent seasons — used for streak, recent form, and head-to-head. */
export async function fetchTeamScheduleHistory(
  teamsUrl: string,
  teamId: string,
  sport: Sport,
  options: { minEvents?: number; maxSeasonsBack?: number } = {},
): Promise<ScheduleEvent[]> {
  const minEvents = options.minEvents ?? 10;
  const maxSeasonsBack = options.maxSeasonsBack ?? 10;
  const anchor = currentSeasonAnchorYear(sport);
  let combined: ScheduleEvent[] = [];

  for (let offset = 0; offset < maxSeasonsBack; offset++) {
    const seasonYear = anchor - offset;
    for (const seasonType of [REGULAR_SEASON_TYPE, POSTSEASON_TYPE]) {
      const url = scheduleUrlForSeason(teamsUrl, teamId, sport, seasonYear, seasonType);
      const res = await fetch(url, { headers: FETCH_HEADERS });
      if (!res.ok) continue;
      const data = await res.json();
      combined = dedupeScheduleEvents([
        ...combined,
        ...filterFinalEvents(data.events ?? []),
      ]);
    }
    if (combined.length >= minEvents) break;
  }

  return sortEventsChronologically(combined);
}

async function fetchFinalScheduleEvents(
  teamsUrl: string,
  teamId: string,
  sport: Sport,
): Promise<ScheduleEvent[]> {
  return fetchTeamScheduleHistory(teamsUrl, teamId, sport, {
    minEvents: 1,
    maxSeasonsBack: isFootballSport(sport) ? 2 : 1,
  });
}

export async function fetchTeamStreak(
  teamId: string,
  teamsUrl: string,
  sport: Sport,
): Promise<string> {
  const events = await fetchFinalScheduleEvents(teamsUrl, teamId, sport);
  return computeStreakFromScheduleEvents(events, teamId);
}
