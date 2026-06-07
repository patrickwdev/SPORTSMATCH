/** Football (NFL / NCAAF) per-game aggregates from schedule + box scores. */

import { footballSeasonYear } from '../utils/sport';
import type { FootballGameStatKind } from './footballStatDefs';

export type FootballGameBucket = {
  games: number;
  pointsFor: number;
  pointsAgainst: number;
  netPassingYards: number;
  oppNetPassingYards: number;
  passCompletions: number;
  passAttempts: number;
  rushingYards: number;
  oppRushingYards: number;
  rushAttempts: number;
  oppRushAttempts: number;
  thirdDownMade: number;
  thirdDownAtt: number;
  oppThirdDownMade: number;
  oppThirdDownAtt: number;
  fourthDownMade: number;
  fourthDownAtt: number;
  giveaways: number;
  takeaways: number;
  penaltyYards: number;
};

export type FootballGameTotals = {
  season: FootballGameBucket;
  home: FootballGameBucket;
  road: FootballGameBucket;
  last3: FootballGameBucket;
  homeWins: number;
  homeLosses: number;
  roadWins: number;
  roadLosses: number;
};

const FINAL_STATUSES = new Set(['STATUS_FINAL']);

const FETCH_HEADERS = {
  Accept: 'application/json',
};

function emptyBucket(): FootballGameBucket {
  return {
    games: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    netPassingYards: 0,
    oppNetPassingYards: 0,
    passCompletions: 0,
    passAttempts: 0,
    rushingYards: 0,
    oppRushingYards: 0,
    rushAttempts: 0,
    oppRushAttempts: 0,
    thirdDownMade: 0,
    thirdDownAtt: 0,
    oppThirdDownMade: 0,
    oppThirdDownAtt: 0,
    fourthDownMade: 0,
    fourthDownAtt: 0,
    giveaways: 0,
    takeaways: 0,
    penaltyYards: 0,
  };
}

function parseScore(score: unknown): number {
  if (score == null) return 0;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    return Number.parseInt(String((score as { value: unknown }).value), 10) || 0;
  }
  return Number.parseInt(String(score), 10) || 0;
}

function parseMadeAttempts(displayValue: unknown): { made: number; attempted: number } {
  if (displayValue == null) return { made: 0, attempted: 0 };
  const raw = String(displayValue).replace('%', '').trim();
  const [madeRaw, attemptedRaw] = raw.split(/[-/]/);
  return {
    made: Number.parseInt(madeRaw ?? '', 10) || 0,
    attempted: Number.parseInt(attemptedRaw ?? '', 10) || 0,
  };
}

function statDisplay(
  stats: Array<{ name: string; displayValue?: unknown }> | undefined,
  name: string,
): unknown {
  return stats?.find((s) => s.name === name)?.displayValue;
}

function statNumber(
  stats: Array<{ name: string; displayValue?: unknown; value?: unknown }> | undefined,
  name: string,
): number {
  const stat = stats?.find((s) => s.name === name);
  if (!stat) return 0;
  if (stat.value != null && !Number.isNaN(Number(stat.value))) {
    return Number(stat.value);
  }
  const n = Number.parseFloat(String(stat.displayValue ?? '').replace(/[^\d.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function addGameScores(
  bucket: FootballGameBucket,
  us: { score?: unknown },
  them: { score?: unknown },
) {
  bucket.games += 1;
  bucket.pointsFor += parseScore(us.score);
  bucket.pointsAgainst += parseScore(them.score);
}

function addBoxStats(
  bucket: FootballGameBucket,
  teamBox: { statistics?: Array<{ name: string; displayValue?: unknown; value?: unknown }> } | undefined,
  oppBox: { statistics?: Array<{ name: string; displayValue?: unknown; value?: unknown }> } | undefined,
) {
  if (!teamBox?.statistics || !oppBox?.statistics) return;

  bucket.netPassingYards += statNumber(teamBox.statistics, 'netPassingYards');
  bucket.oppNetPassingYards += statNumber(oppBox.statistics, 'netPassingYards');
  bucket.rushingYards += statNumber(teamBox.statistics, 'rushingYards');
  bucket.oppRushingYards += statNumber(oppBox.statistics, 'rushingYards');
  bucket.rushAttempts += statNumber(teamBox.statistics, 'rushingAttempts');
  bucket.oppRushAttempts += statNumber(oppBox.statistics, 'rushingAttempts');
  bucket.giveaways += statNumber(teamBox.statistics, 'turnovers');
  bucket.takeaways += statNumber(oppBox.statistics, 'turnovers');
  bucket.penaltyYards += statNumber(teamBox.statistics, 'totalPenaltiesYards');

  const pass = parseMadeAttempts(statDisplay(teamBox.statistics, 'completionAttempts'));
  bucket.passCompletions += pass.made;
  bucket.passAttempts += pass.attempted;

  const third = parseMadeAttempts(statDisplay(teamBox.statistics, 'thirdDownEff'));
  bucket.thirdDownMade += third.made;
  bucket.thirdDownAtt += third.attempted;

  const oppThird = parseMadeAttempts(statDisplay(oppBox.statistics, 'thirdDownEff'));
  bucket.oppThirdDownMade += oppThird.made;
  bucket.oppThirdDownAtt += oppThird.attempted;

  const fourth = parseMadeAttempts(statDisplay(teamBox.statistics, 'fourthDownEff'));
  bucket.fourthDownMade += fourth.made;
  bucket.fourthDownAtt += fourth.attempted;
}

function extractFootballBucketValue(
  bucket: FootballGameBucket,
  kind: FootballGameStatKind,
): number | null {
  if (bucket.games === 0) return null;
  const g = bucket.games;

  switch (kind) {
    case 'pointsFor':
      return bucket.pointsFor / g;
    case 'pointsAgainst':
      return bucket.pointsAgainst / g;
    case 'netPassingYards':
      return bucket.netPassingYards / g;
    case 'oppNetPassingYards':
      return bucket.oppNetPassingYards / g;
    case 'yardsPerPass':
      return bucket.passAttempts > 0 ? bucket.netPassingYards / bucket.passAttempts : null;
    case 'completionPct':
      return bucket.passAttempts > 0 ? bucket.passCompletions / bucket.passAttempts : null;
    case 'rushingYards':
      return bucket.rushingYards / g;
    case 'oppRushingYards':
      return bucket.oppRushingYards / g;
    case 'yardsPerRush':
      return bucket.rushAttempts > 0 ? bucket.rushingYards / bucket.rushAttempts : null;
    case 'thirdDownPct':
      return bucket.thirdDownAtt > 0 ? bucket.thirdDownMade / bucket.thirdDownAtt : null;
    case 'oppThirdDownPct':
      return bucket.oppThirdDownAtt > 0 ? bucket.oppThirdDownMade / bucket.oppThirdDownAtt : null;
    case 'fourthDownPct':
      return bucket.fourthDownAtt > 0 ? bucket.fourthDownMade / bucket.fourthDownAtt : null;
    case 'giveaways':
      return bucket.giveaways / g;
    case 'takeaways':
      return bucket.takeaways / g;
    case 'penaltyYards':
      return bucket.penaltyYards / g;
    default:
      return null;
  }
}

export function extractFootballGameTotalsValue(
  totals: FootballGameTotals | null,
  split: 'season' | 'home' | 'away' | 'last7',
  kind: FootballGameStatKind,
): number | null {
  if (!totals) return null;
  const bucket =
    split === 'season'
      ? totals.season
      : split === 'home'
        ? totals.home
        : split === 'away'
          ? totals.road
          : totals.last3;
  return extractFootballBucketValue(bucket, kind);
}

export function formatFootballVenueRecord(wins: number, losses: number): string {
  if (wins === 0 && losses === 0) return '—';
  return `${wins}-${losses}`;
}

async function fetchScheduleEvents(
  teamsUrl: string,
  teamId: string,
  season: number,
): Promise<Array<{
  id: string;
  competitions: Array<{
    competitors: Array<{
      team?: { id?: string };
      homeAway?: string;
      score?: unknown;
      winner?: boolean;
    }>;
    status?: { type?: { name?: string } };
  }>;
}>> {
  const schedRes = await fetch(
    `${teamsUrl}/${teamId}/schedule?season=${season}&seasontype=2`,
    { headers: FETCH_HEADERS },
  );
  if (!schedRes.ok) return [];
  const schedData = await schedRes.json();
  return (schedData.events ?? []).filter(
    (event: { competitions?: Array<{ status?: { type?: { name?: string } } }> }) => {
      const status = event.competitions?.[0]?.status?.type?.name ?? '';
      return FINAL_STATUSES.has(status);
    },
  );
}

export async function fetchFootballVenueRecord(
  teamId: string,
  teamsUrl: string,
): Promise<{ home: string; away: string }> {
  let events: Awaited<ReturnType<typeof fetchScheduleEvents>> = [];
  const primarySeason = footballSeasonYear();
  for (const season of [primarySeason, primarySeason - 1]) {
    events = await fetchScheduleEvents(teamsUrl, teamId, season);
    if (events.length > 0) break;
  }

  let homeWins = 0;
  let homeLosses = 0;
  let roadWins = 0;
  let roadLosses = 0;

  for (const event of events) {
    const comp = event.competitions[0];
    const us = comp.competitors.find((c) => String(c.team?.id) === teamId);
    if (!us) continue;
    const won = us.winner === true;
    if (us.homeAway === 'home') {
      if (won) homeWins += 1;
      else homeLosses += 1;
    } else if (won) roadWins += 1;
    else roadLosses += 1;
  }

  return {
    home: formatFootballVenueRecord(homeWins, homeLosses),
    away: formatFootballVenueRecord(roadWins, roadLosses),
  };
}

export async function fetchFootballGameTotals(
  teamId: string,
  teamsUrl: string,
): Promise<FootballGameTotals | null> {
  let events: Awaited<ReturnType<typeof fetchScheduleEvents>> = [];
  const primarySeason = footballSeasonYear();
  for (const season of [primarySeason, primarySeason - 1]) {
    events = await fetchScheduleEvents(teamsUrl, teamId, season);
    if (events.length > 0) break;
  }

  if (events.length === 0) return null;

  const last3Ids = new Set(events.slice(-3).map((e) => e.id));
  const totals: FootballGameTotals = {
    season: emptyBucket(),
    home: emptyBucket(),
    road: emptyBucket(),
    last3: emptyBucket(),
    homeWins: 0,
    homeLosses: 0,
    roadWins: 0,
    roadLosses: 0,
  };

  const summaryBase = teamsUrl.replace('/teams', '');

  for (const event of events) {
    const comp = event.competitions[0];
    const us = comp.competitors.find((c) => String(c.team?.id) === teamId);
    const them = comp.competitors.find((c) => String(c.team?.id) !== teamId);
    if (!us || !them) continue;

    const isHome = us.homeAway === 'home';
    const venue = isHome ? totals.home : totals.road;
    const won = us.winner === true;

    if (isHome) {
      if (won) totals.homeWins += 1;
      else totals.homeLosses += 1;
    } else if (won) totals.roadWins += 1;
    else totals.roadLosses += 1;

    addGameScores(totals.season, us, them);
    addGameScores(venue, us, them);
    if (last3Ids.has(event.id)) {
      addGameScores(totals.last3, us, them);
    }

    try {
      const sumRes = await fetch(`${summaryBase}/summary?event=${event.id}`, {
        headers: FETCH_HEADERS,
      });
      if (!sumRes.ok) continue;
      const summary = await sumRes.json();
      const teams = summary.boxscore?.teams ?? [];
      const teamBox = teams.find((t: { team?: { id?: string } }) => String(t.team?.id) === teamId);
      const oppBox = teams.find((t: { team?: { id?: string } }) => String(t.team?.id) !== teamId);
      addBoxStats(totals.season, teamBox, oppBox);
      addBoxStats(venue, teamBox, oppBox);
      if (last3Ids.has(event.id)) {
        addBoxStats(totals.last3, teamBox, oppBox);
      }
    } catch {
      // Score-only aggregates still apply.
    }
  }

  return totals.season.games > 0 ? totals : null;
}
