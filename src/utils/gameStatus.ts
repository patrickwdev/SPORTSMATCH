import type { GameStatus, Match } from '../types';

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

export function hasLiveScore(match: Match): boolean {
  return (
    match.awayScore != null &&
    match.homeScore != null &&
    match.gameStatus !== 'scheduled'
  );
}

export function formatScoreLine(match: Match): string {
  if (!hasLiveScore(match)) {
    return '';
  }
  return `${match.awayTeam.abbreviation} ${match.awayScore} – ${match.homeScore} ${match.homeTeam.abbreviation}`;
}

export function formatMatchMeta(match: Match): string {
  if (hasLiveScore(match)) {
    const detail = match.statusDetail ? `${match.statusDetail} · ` : '';
    return `${detail}${match.startTime} · ${match.location}`;
  }
  if (match.gameStatus && match.gameStatus !== 'scheduled') {
    const status = match.statusDetail ?? formatGameStatusLabel(match.gameStatus);
    return `${status} · ${match.location}`;
  }
  return `${match.startTime} · ${match.location}`;
}
