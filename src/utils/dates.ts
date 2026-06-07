import type { Sport } from '../types';
import { isSparseScheduleSport } from '../constants/sports';
import { isEspnCachedSport } from '../lib/espnLeagues';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const ESPN_GAME_DATE_TZ = 'America/New_York';
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type DayOption = {
  isoDate: string;
  shortLabel: string;
  subLabel: string;
};

export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calendar date for ESPN-synced leagues (matches `gameDateFromEventStart`). */
export function toISODateEastern(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: ESPN_GAME_DATE_TZ });
}

export function dateFromIso(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Today" for match-day logic — Eastern for ESPN leagues, device-local otherwise. */
export function todayIsoForSport(sport: Sport, now = new Date()): string {
  return isEspnCachedSport(sport) ? toISODateEastern(now) : toISODateLocal(now);
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Shift a YYYY-MM-DD string by `days` on the calendar. */
export function addDaysToIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toISODateLocal(addDaysLocal(new Date(y, m - 1, d), days));
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffsetFromToday(isoDate: string, todayIso: string): number {
  const [y1, m1, d1] = todayIso.split('-').map(Number);
  const [y2, m2, d2] = isoDate.split('-').map(Number);
  const todayMs = new Date(y1, m1 - 1, d1).getTime();
  const dayMs = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((dayMs - todayMs) / 86_400_000);
}

function toDayOptionFromIso(isoDate: string, todayIso: string): DayOption {
  const offset = dayOffsetFromToday(isoDate, todayIso);
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const shortLabel =
    offset === -1
      ? 'Yest'
      : offset === 0
        ? 'Today'
        : offset === 1
          ? 'Tom'
          : WEEKDAYS[date.getDay()];
  const subLabel = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return { isoDate, shortLabel, subLabel };
}

function toDayOption(date: Date, todayIso: string): DayOption {
  return toDayOptionFromIso(toISODateLocal(date), todayIso);
}

/** ISO date string for today + `offset` days (local calendar). */
export function gameDateFromToday(offset: number): string {
  return toISODateLocal(addDaysLocal(new Date(), offset));
}

/** @deprecated Prefer `buildMatchDayPickerOptions` */
export function getNext7DayOptions(anchor = new Date()): DayOption[] {
  return buildMatchDayPickerOptions([], { forwardDays: 6, anchor });
}

type MatchWithGameDate = { gameDate: string };

/** First future match day after `todayIso`, or null if none. */
export function nextMatchDayIso(
  matches: MatchWithGameDate[],
  todayIso = toISODateLocal(new Date()),
): string | null {
  const next = matches
    .filter((m) => m.gameDate > todayIso)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate))[0];
  return next?.gameDate ?? null;
}

/** Most recent match day before `todayIso`, or null if none. */
export function mostRecentMatchDayIso(
  matches: MatchWithGameDate[],
  todayIso = toISODateLocal(new Date()),
): string | null {
  const recent = matches
    .filter((m) => isValidGameDate(m.gameDate) && m.gameDate < todayIso)
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate))[0];
  return recent?.gameDate ?? null;
}

function isValidGameDate(iso: string | undefined): iso is string {
  return !!iso && /^\d{4}-\d{2}-\d{2}$/.test(iso);
}

/** Today if games exist; else next match day (sparse leagues); else most recent past day. */
export function defaultMatchDayIso(matches: MatchWithGameDate[], sport: Sport): string {
  const todayIso = todayIsoForSport(sport);
  const hasGamesToday = matches.some(
    (m) => isValidGameDate(m.gameDate) && m.gameDate === todayIso,
  );
  if (hasGamesToday) return todayIso;

  const next = nextMatchDayIso(matches, todayIso);
  if (next) return next;

  if (isSparseScheduleSport(sport)) {
    return mostRecentMatchDayIso(matches, todayIso) ?? todayIso;
  }

  return todayIso;
}

/**
 * Day chips from `backwardDays` before today through `forwardDays` ahead,
 * extended if matches fall outside that range.
 */
export function buildMatchDayPickerOptions(
  matches: MatchWithGameDate[],
  options: { forwardDays?: number; backwardDays?: number; anchor?: Date; sport?: Sport } = {},
): DayOption[] {
  const { forwardDays = 20, backwardDays = 7, anchor = new Date(), sport } = options;
  const useEastern = sport != null && isEspnCachedSport(sport);
  const todayIso = useEastern ? todayIsoForSport(sport, anchor) : toISODateLocal(anchor);

  let startIso = useEastern
    ? addDaysToIso(todayIso, -backwardDays)
    : toISODateLocal(addDaysLocal(startOfLocalDay(anchor), -backwardDays));
  let endIso = useEastern
    ? addDaysToIso(todayIso, forwardDays)
    : toISODateLocal(addDaysLocal(startOfLocalDay(anchor), forwardDays));

  for (const match of matches) {
    if (!isValidGameDate(match.gameDate)) continue;
    if (match.gameDate < startIso) startIso = match.gameDate;
    if (match.gameDate > endIso) endIso = match.gameDate;
  }

  const days: DayOption[] = [];
  let cursorIso = startIso;
  while (cursorIso <= endIso) {
    days.push(toDayOptionFromIso(cursorIso, todayIso));
    cursorIso = addDaysToIso(cursorIso, 1);
  }
  return days;
}

export function formatSelectedDayLabel(isoDate: string, todayIso = toISODateLocal(new Date())): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const todayStart = new Date(ty, tm - 1, td);
  const yesterdayIso = toISODateLocal(addDaysLocal(todayStart, -1));
  const tomorrowIso = toISODateLocal(addDaysLocal(todayStart, 1));

  if (isoDate === todayIso) {
    return 'Today';
  }
  if (isoDate === yesterdayIso) {
    return 'Yesterday';
  }
  if (isoDate === tomorrowIso) {
    return 'Tomorrow';
  }
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
