import type { Sport } from '../types';

export function isFootballSport(sport: Sport): boolean {
  return sport === 'NFL' || sport === 'NCAAF';
}

export function isBasketballSport(sport: Sport): boolean {
  return sport === 'NBA' || sport === 'WNBA' || sport === 'NCAAB' || sport === 'NCAAW';
}

export function footballSeasonYear(): number {
  const now = new Date();
  // NFL/NCAAF seasons span two calendar years; use Sept cutoff.
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}
