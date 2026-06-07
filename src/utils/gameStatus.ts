import type { GameStatus, Match } from '../types';

export function mapEspnGameStatus(espnStatusName: string): GameStatus {
  switch (espnStatusName) {
    case 'STATUS_SCHEDULED':
    case 'STATUS_PREVIEW':
    case 'STATUS_NOT_STARTED':
      return 'scheduled';
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
    case 'STATUS_FIRST_HALF':
    case 'STATUS_SECOND_HALF':
      return 'in_progress';
    case 'STATUS_FINAL':
    case 'STATUS_FULL_TIME':
    case 'STATUS_END_OF_GAME':
      return 'final';
    case 'STATUS_POSTPONED':
      return 'postponed';
    case 'STATUS_DELAYED':
      return 'delayed';
    case 'STATUS_CANCELED':
    case 'STATUS_CANCELLED':
      return 'canceled';
    case 'STATUS_SUSPENDED':
      return 'suspended';
    default:
      return 'unknown';
  }
}

export function parseEspnScore(score: unknown): number | null {
  if (score == null) return null;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    const n = Number.parseInt(String((score as { value: unknown }).value), 10);
    return Number.isNaN(n) ? null : n;
  }
  const n = Number.parseInt(String(score), 10);
  return Number.isNaN(n) ? null : n;
}

export function formatGameStatusLabel(status?: GameStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'final':
      return 'Final';
    case 'unknown':
      return '';
    case 'postponed':
      return 'Postponed';
    case 'delayed':
      return 'Delayed';
    case 'canceled':
      return 'Canceled';
    case 'suspended':
      return 'Suspended';
    default:
      return '';
  }
}

export function isLiveGame(match: Match): boolean {
  return (
    match.gameStatus === 'in_progress' ||
    match.gameStatus === 'delayed' ||
    match.gameStatus === 'suspended'
  );
}

export function isFinalGame(match: Match): boolean {
  return match.gameStatus === 'final';
}

/** Show score line when we have numbers and the game has started or finished. */
export function shouldShowScore(match: Match): boolean {
  if (match.awayScore == null || match.homeScore == null) return false;
  if (match.gameStatus === 'scheduled') return false;
  return true;
}

/** @deprecated Use `shouldShowScore` */
export function hasLiveScore(match: Match): boolean {
  return shouldShowScore(match);
}

export function formatScoreLine(match: Match): string {
  if (!shouldShowScore(match)) return '';

  const line = `${match.awayTeam.abbreviation} ${match.awayScore} – ${match.homeScore} ${match.homeTeam.abbreviation}`;

  if (isFinalGame(match)) {
    return line;
  }

  if (isLiveGame(match) && match.statusDetail) {
    return `${line} · ${match.statusDetail}`;
  }

  return line;
}

export function formatMatchMeta(match: Match): string {
  if (shouldShowScore(match)) {
    if (isFinalGame(match)) {
      const status = match.statusDetail ?? 'Final';
      return `${status} · ${match.location}`;
    }
    if (isLiveGame(match)) {
      return match.location;
    }
    const status = match.statusDetail ?? formatGameStatusLabel(match.gameStatus);
    return `${status} · ${match.location}`;
  }

  if (match.gameStatus && match.gameStatus !== 'scheduled') {
    const status = match.statusDetail ?? formatGameStatusLabel(match.gameStatus);
    return `${status} · ${match.location}`;
  }

  return `${match.startTime} · ${match.location}`;
}
