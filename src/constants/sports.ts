import type { Sport } from '../types';

export interface SportOption {
  value: Sport;
  title: string;
  subtitle: string;
}

export const SPORT_OPTIONS: SportOption[] = [
  { value: 'NFL', title: 'NFL', subtitle: 'National Football League' },
  { value: 'NCAAF', title: 'NCAAF', subtitle: 'College Football' },
  { value: 'MLB', title: 'MLB', subtitle: 'Major League Baseball' },
  { value: 'MLS', title: 'MLS', subtitle: 'Major League Soccer' },
  { value: 'NBA', title: 'NBA', subtitle: 'National Basketball Association' },
  { value: 'NHL', title: 'NHL', subtitle: 'National Hockey League' },
  { value: 'WNBA', title: 'WNBA', subtitle: "Women's National Basketball Association" },
  { value: 'NCAAB', title: 'NCAAB', subtitle: "Men's College Basketball" },
  { value: 'NCAAW', title: 'NCAAW', subtitle: "Women's College Basketball" },
];

export const SPORTS: Sport[] = SPORT_OPTIONS.map((o) => o.value);

/** How many past calendar days the matches day picker shows (yesterday = 1). */
export const DAY_PICKER_BACKWARD_DAYS: Partial<Record<Sport, number>> = {
  NFL: 14,
  NCAAF: 14,
  MLS: 14,
};

export const DEFAULT_DAY_PICKER_BACKWARD_DAYS = 7;

/** How many future calendar days the matches day picker shows (inclusive of today). */
export const DAY_PICKER_FORWARD_DAYS: Partial<Record<Sport, number>> = {
  NFL: 90,
  NCAAF: 120,
  MLS: 60,
  NCAAB: 21,
  NCAAW: 21,
};

export const DEFAULT_DAY_PICKER_FORWARD_DAYS = 20;

export function dayPickerBackwardDays(sport: Sport): number {
  return DAY_PICKER_BACKWARD_DAYS[sport] ?? DEFAULT_DAY_PICKER_BACKWARD_DAYS;
}

export function dayPickerForwardDays(sport: Sport): number {
  return DAY_PICKER_FORWARD_DAYS[sport] ?? DEFAULT_DAY_PICKER_FORWARD_DAYS;
}

/** Weekly/sparse schedules — auto-select next match day when today is empty. */
export function isSparseScheduleSport(sport: Sport): boolean {
  return sport === 'NFL' || sport === 'NCAAF' || sport === 'MLS';
}
