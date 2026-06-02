import type { StatRow } from '../types';
import { colors } from '../theme/colors';

export function formatStatValue(value: number | null | undefined, format?: StatRow['format']): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  if (format === 'percent') {
    return value >= 1 ? value.toFixed(3).replace(/^0/, '') : value.toFixed(3);
  }
  if (format === 'integer') {
    return Math.round(value).toString();
  }
  if (format === 'decimal') {
    if (value >= 1) {
      return value.toFixed(2);
    }
    const fixed = value.toFixed(3);
    return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
  }
  if (Number.isInteger(value * 10)) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

export function rankColor(rank: number, maxTeams = 32): string {
  const third = maxTeams / 3;
  if (rank <= third) return colors.green;
  if (rank <= third * 2) return colors.yellow;
  return colors.red;
}

export function sportMaxTeams(sport: string): number {
  switch (sport) {
    case 'WNBA':
      return 12;
    case 'NBA':
      return 30;
    case 'NCAAB':
      return 362;
    case 'NCAAW':
      return 361;
    case 'NHL':
      return 32;
    case 'MLS':
      return 29;
    case 'MLB':
      return 30;
    default:
      return 32;
  }
}
