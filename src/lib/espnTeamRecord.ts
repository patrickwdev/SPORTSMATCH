import type { Sport, TeamRecord, TeamSummary } from '../types';
import { isFootballSport } from '../utils/sport';
import { fetchFootballVenueRecord } from './espnFootballGameTotals';
import { ESPN_CACHED_SPORTS, type EspnCachedSport } from './espnLeagues';
import { fetchTeamStreak, formatStreakDisplay } from './espnStreak';

const FETCH_HEADERS = { Accept: 'application/json' };

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

export function formatWinPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const pct = n > 1 ? n / 100 : n;
  if (pct >= 1) return '1.000';
  const fixed = pct.toFixed(3);
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

export function winPctFromRecordSummary(summary: string | undefined, sport: Sport): string {
  if (!summary || summary === '—') return '—';
  const parts = summary.split('-').map((p) => Number.parseInt(p.trim(), 10));
  if (parts.some((n) => Number.isNaN(n))) return '—';

  let pct: number | null = null;
  if (parts.length === 2) {
    const [w, l] = parts;
    const gp = w + l;
    if (gp > 0) pct = w / gp;
  } else if (parts.length === 3) {
    const [w, l, t] = parts;
    const gp = w + l + t;
    if (gp > 0) pct = (w + (sport === 'MLS' ? 0.5 * t : 0)) / gp;
  }

  return pct == null ? '—' : formatWinPct(pct);
}

function formatPoints(stats: Record<string, number>, sport: Sport): string {
  if (sport === 'NHL') {
    const pts = stats.points;
    const gp = stats.gamesPlayed;
    if (
      pts != null &&
      gp != null &&
      Number(gp) > 0 &&
      !Number.isNaN(Number(pts)) &&
      !Number.isNaN(Number(gp))
    ) {
      return (Number(pts) / Number(gp)).toFixed(2);
    }
    return '—';
  }
  if (sport === 'MLS') {
    const pts = stats.points;
    if (pts != null && !Number.isNaN(Number(pts))) {
      return String(Math.round(Number(pts)));
    }
  }
  return '—';
}

function formatStreak(stats: Record<string, number>): string {
  const streak = stats.streak;
  if (streak == null || streak === 0) return '—';
  return formatStreakDisplay(streak);
}

function extractVenueRecords(
  items: EspnRecordItem[] | undefined,
): Pick<TeamRecord, 'homeRecord' | 'awayRecord'> {
  if (!items?.length) return {};
  const home = items.find((i) => i.type === 'home');
  const road = items.find((i) => i.type === 'road' || i.type === 'away');
  return {
    homeRecord: home?.summary,
    awayRecord: road?.summary,
  };
}

function buildTeamRecord(
  summary: string,
  stats: Record<string, number>,
  sport: Sport,
  venueRecords: Pick<TeamRecord, 'homeRecord' | 'awayRecord'> = {},
): TeamRecord {
  let winPct = formatWinPct(stats.winPercent);
  if (winPct === '—' && sport === 'MLS' && stats.gamesPlayed > 0) {
    const w = Number(stats.wins) || 0;
    const t = Number(stats.ties) || 0;
    const gp = Number(stats.gamesPlayed);
    winPct = formatWinPct((w + 0.5 * t) / gp);
  }
  if (winPct === '—') {
    winPct = winPctFromRecordSummary(summary, sport);
  }

  return {
    overall: summary ?? '—',
    winPct,
    points: formatPoints(stats, sport),
    streak: formatStreak(stats),
    ...venueRecords,
  };
}

type EspnRecordItem = {
  type?: string;
  summary?: string;
  stats?: Array<{ name: string; value: number }>;
};

function parseTeamRecord(
  overallSummary: string | undefined,
  teamDetailRecord: { items?: EspnRecordItem[] } | null | undefined,
  sport: Sport,
): TeamRecord {
  const venueRecords = extractVenueRecords(teamDetailRecord?.items);

  if (teamDetailRecord?.items?.length) {
    const overall =
      teamDetailRecord.items.find((i) => i.type === 'total') ?? teamDetailRecord.items[0];
    const summary = overall.summary ?? overallSummary ?? '—';
    const stats = Object.fromEntries((overall.stats ?? []).map((s) => [s.name, s.value]));
    return buildTeamRecord(summary, stats, sport, venueRecords);
  }

  const summary = overallSummary ?? '—';
  return {
    overall: summary,
    winPct: winPctFromRecordSummary(summary, sport),
    points: '—',
    streak: '—',
    ...venueRecords,
  };
}

async function fetchTeamDetailRecord(
  teamsUrl: string,
  teamId: string,
): Promise<{ items?: EspnRecordItem[] } | null> {
  const res = await fetch(`${teamsUrl}/${teamId}`, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return data.team?.record ?? null;
}

function needsRecordEnrichment(record: TeamRecord, sport: Sport): boolean {
  if (record.winPct === '—' || record.winPct === '') return true;
  if (sport === 'MLS' && record.points === '—') return true;
  if (sport === 'NHL' && record.points === '—') return true;
  if (sport === 'NHL' && record.points !== '—') {
    const n = Number(record.points);
    if (!Number.isNaN(n) && n >= 10 && !record.points.includes('.')) return true;
  }
  return false;
}

async function applyScheduleStreak(
  team: TeamSummary,
  sport: Sport,
  teamsUrl: string,
): Promise<TeamSummary> {
  const streak = await fetchTeamStreak(team.id, teamsUrl, sport);
  if (streak === '—') return team;
  return { ...team, record: { ...team.record, streak } };
}

function needsVenueRecordEnrichment(record: TeamRecord): boolean {
  return !record.homeRecord || !record.awayRecord;
}

async function enrichTeam(
  team: TeamSummary,
  sport: EspnCachedSport,
  teamsUrl: string,
): Promise<TeamSummary> {
  let enriched = team;

  if (isFootballSport(sport)) {
    const venue = await fetchFootballVenueRecord(team.id, teamsUrl);
    enriched = {
      ...enriched,
      record: {
        ...enriched.record,
        homeRecord: venue.home,
        awayRecord: venue.away,
      },
    };
  } else if (
    sport === 'NHL' ||
    needsRecordEnrichment(team.record, sport) ||
    needsVenueRecordEnrichment(team.record)
  ) {
    const detail = await fetchTeamDetailRecord(teamsUrl, team.id);
    enriched = { ...enriched, record: parseTeamRecord(team.record.overall, detail, sport) };
  }

  return applyScheduleStreak(enriched, sport, teamsUrl);
}

export async function enrichMatchTeamRecords(match: {
  sport: Sport;
  awayTeam: TeamSummary;
  homeTeam: TeamSummary;
}): Promise<{ awayTeam: TeamSummary; homeTeam: TeamSummary }> {
  if (!(match.sport in ESPN_CACHED_SPORTS)) {
    return { awayTeam: match.awayTeam, homeTeam: match.homeTeam };
  }

  const sport = match.sport as EspnCachedSport;
  const teamsUrl = TEAMS_URL[sport];

  const [awayTeam, homeTeam] = await Promise.all([
    enrichTeam(match.awayTeam, sport, teamsUrl),
    enrichTeam(match.homeTeam, sport, teamsUrl),
  ]);

  return { awayTeam, homeTeam };
}
