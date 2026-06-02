/** Basketball (NBA/WNBA/NCAAB/NCAAW) box-score aggregates from game logs (season, home, road, last 5). */

export type NbaGameBucket = {
  games: number;
  pointsFor: number;
  pointsAgainst: number;
  totalRebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointMade: number;
  threePointAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  oppFieldGoalsMade: number;
  oppFieldGoalsAttempted: number;
  oppThreePointMade: number;
  oppThreePointAttempted: number;
  offensiveRebounds: number;
  oppOffensiveRebounds: number;
  oppFreeThrowsAttempted: number;
  oppTurnovers: number;
};

export type NbaGameTotals = {
  season: NbaGameBucket;
  home: NbaGameBucket;
  road: NbaGameBucket;
  last5: NbaGameBucket;
};

export type NbaGameStatKind =
  | 'pointsFor'
  | 'pointsAgainst'
  | 'totalRebounds'
  | 'assists'
  | 'fieldGoalsMade'
  | 'fieldGoalPct'
  | 'threePointFieldGoalPct'
  | 'freeThrowPct'
  | 'twoPointPct'
  | 'oppTwoPointPct'
  | 'oppThreePointPct'
  | 'turnovers'
  | 'steals'
  | 'blocks'
  | 'pace';

const FINAL_STATUSES = new Set(['STATUS_FINAL']);

const FETCH_HEADERS = {
  Accept: 'application/json',
};

function emptyBucket(): NbaGameBucket {
  return {
    games: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    totalRebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointMade: 0,
    threePointAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    oppFieldGoalsMade: 0,
    oppFieldGoalsAttempted: 0,
    oppThreePointMade: 0,
    oppThreePointAttempted: 0,
    offensiveRebounds: 0,
    oppOffensiveRebounds: 0,
    oppFreeThrowsAttempted: 0,
    oppTurnovers: 0,
  };
}

function parseScore(score: unknown): number {
  if (score == null) return 0;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    return Number.parseInt(String((score as { value: unknown }).value), 10) || 0;
  }
  return Number.parseInt(String(score), 10) || 0;
}

function parseStatNumber(stat: { value?: unknown; displayValue?: unknown } | undefined): number {
  if (!stat) return 0;
  if (stat.value != null && !Number.isNaN(Number(stat.value))) {
    return Number(stat.value);
  }
  if (stat.displayValue != null) {
    const n = Number.parseFloat(String(stat.displayValue).replace('%', ''));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function parseMakesAttempts(displayValue: unknown): { made: number; attempted: number } {
  if (displayValue == null) return { made: 0, attempted: 0 };
  const [madeRaw, attemptedRaw] = String(displayValue).split('-');
  const made = Number.parseInt(madeRaw ?? '', 10) || 0;
  const attempted = Number.parseInt(attemptedRaw ?? '', 10) || 0;
  return { made, attempted };
}

function addGame(
  bucket: NbaGameBucket,
  us: { score?: unknown },
  them: { score?: unknown },
) {
  bucket.games += 1;
  bucket.pointsFor += parseScore(us.score);
  bucket.pointsAgainst += parseScore(them.score);
}

function addBoxStats(
  bucket: NbaGameBucket,
  teamBox: { statistics?: Array<{ name: string; value?: unknown; displayValue?: unknown }> } | undefined,
  oppBox: { statistics?: Array<{ name: string; value?: unknown; displayValue?: unknown }> } | undefined,
) {
  const getStat = (name: string) => teamBox?.statistics?.find((s) => s.name === name);
  const getOppStat = (name: string) => oppBox?.statistics?.find((s) => s.name === name);
  const fg = parseMakesAttempts(getStat('fieldGoalsMade-fieldGoalsAttempted')?.displayValue);
  const three = parseMakesAttempts(
    getStat('threePointFieldGoalsMade-threePointFieldGoalsAttempted')?.displayValue,
  );
  const ft = parseMakesAttempts(getStat('freeThrowsMade-freeThrowsAttempted')?.displayValue);
  const oppFg = parseMakesAttempts(
    getOppStat('fieldGoalsMade-fieldGoalsAttempted')?.displayValue,
  );
  const oppThree = parseMakesAttempts(
    getOppStat('threePointFieldGoalsMade-threePointFieldGoalsAttempted')?.displayValue,
  );
  const oppFt = parseMakesAttempts(getOppStat('freeThrowsMade-freeThrowsAttempted')?.displayValue);

  bucket.totalRebounds += parseStatNumber(getStat('totalRebounds'));
  bucket.assists += parseStatNumber(getStat('assists'));
  bucket.turnovers += parseStatNumber(getStat('totalTurnovers')) || parseStatNumber(getStat('turnovers'));
  bucket.steals += parseStatNumber(getStat('steals'));
  bucket.blocks += parseStatNumber(getStat('blocks'));
  bucket.fieldGoalsMade += fg.made;
  bucket.fieldGoalsAttempted += fg.attempted;
  bucket.threePointMade += three.made;
  bucket.threePointAttempted += three.attempted;
  bucket.freeThrowsMade += ft.made;
  bucket.freeThrowsAttempted += ft.attempted;
  bucket.oppFieldGoalsMade += oppFg.made;
  bucket.oppFieldGoalsAttempted += oppFg.attempted;
  bucket.oppThreePointMade += oppThree.made;
  bucket.oppThreePointAttempted += oppThree.attempted;
  bucket.offensiveRebounds += parseStatNumber(getStat('offensiveRebounds'));
  bucket.oppOffensiveRebounds += parseStatNumber(getOppStat('offensiveRebounds'));
  bucket.oppFreeThrowsAttempted += oppFt.attempted;
  bucket.oppTurnovers +=
    parseStatNumber(getOppStat('totalTurnovers')) || parseStatNumber(getOppStat('turnovers'));
}

export function extractNbaBucketValue(
  bucket: NbaGameBucket | null,
  kind: NbaGameStatKind,
): number | null {
  if (!bucket || bucket.games <= 0) return null;
  switch (kind) {
    case 'pointsFor':
      return bucket.pointsFor / bucket.games;
    case 'pointsAgainst':
      return bucket.pointsAgainst / bucket.games;
    case 'totalRebounds':
      return bucket.totalRebounds / bucket.games;
    case 'assists':
      return bucket.assists / bucket.games;
    case 'fieldGoalsMade':
      return bucket.fieldGoalsMade / bucket.games;
    case 'fieldGoalPct':
      return bucket.fieldGoalsAttempted > 0 ? bucket.fieldGoalsMade / bucket.fieldGoalsAttempted : null;
    case 'threePointFieldGoalPct':
      return bucket.threePointAttempted > 0 ? bucket.threePointMade / bucket.threePointAttempted : null;
    case 'freeThrowPct':
      return bucket.freeThrowsAttempted > 0 ? bucket.freeThrowsMade / bucket.freeThrowsAttempted : null;
    case 'twoPointPct': {
      const made = bucket.fieldGoalsMade - bucket.threePointMade;
      const attempted = bucket.fieldGoalsAttempted - bucket.threePointAttempted;
      return attempted > 0 ? made / attempted : null;
    }
    case 'oppTwoPointPct': {
      const made = bucket.oppFieldGoalsMade - bucket.oppThreePointMade;
      const attempted = bucket.oppFieldGoalsAttempted - bucket.oppThreePointAttempted;
      return attempted > 0 ? made / attempted : null;
    }
    case 'oppThreePointPct':
      return bucket.oppThreePointAttempted > 0
        ? bucket.oppThreePointMade / bucket.oppThreePointAttempted
        : null;
    case 'turnovers':
      return bucket.turnovers / bucket.games;
    case 'steals':
      return bucket.steals / bucket.games;
    case 'blocks':
      return bucket.blocks / bucket.games;
    case 'pace': {
      const teamPoss =
        bucket.fieldGoalsAttempted +
        0.44 * bucket.freeThrowsAttempted -
        bucket.offensiveRebounds +
        bucket.turnovers;
      const oppPoss =
        bucket.oppFieldGoalsAttempted +
        0.44 * bucket.oppFreeThrowsAttempted -
        bucket.oppOffensiveRebounds +
        bucket.oppTurnovers;
      return (teamPoss + oppPoss) / (2 * bucket.games);
    }
    default:
      return null;
  }
}

export function extractNbaGameTotalsValue(
  totals: NbaGameTotals | null,
  split: 'season' | 'home' | 'away' | 'last7',
  kind: NbaGameStatKind,
): number | null {
  if (!totals) return null;
  const bucket =
    split === 'season'
      ? totals.season
      : split === 'home'
        ? totals.home
        : split === 'away'
          ? totals.road
          : totals.last5;
  return extractNbaBucketValue(bucket, kind);
}

export async function fetchNbaGameTotals(
  teamId: string,
  scheduleBaseUrl: string,
): Promise<NbaGameTotals | null> {
  const schedRes = await fetch(`${scheduleBaseUrl}/${teamId}/schedule?seasontype=2`, {
    headers: FETCH_HEADERS,
  });
  if (!schedRes.ok) return null;

  const schedData = await schedRes.json();
  const events = (schedData.events ?? []).filter(
    (event: { competitions?: Array<{ status?: { type?: { name?: string } } }> }) => {
      const status = event.competitions?.[0]?.status?.type?.name ?? '';
      return FINAL_STATUSES.has(status);
    },
  );

  if (events.length === 0) return null;

  const last5Ids = new Set(events.slice(-5).map((e: { id: string }) => e.id));
  const totals: NbaGameTotals = {
    season: emptyBucket(),
    home: emptyBucket(),
    road: emptyBucket(),
    last5: emptyBucket(),
  };

  for (const event of events as Array<{
    id: string;
    competitions: Array<{
      competitors: Array<{ team?: { id?: string; homeAway?: string }; score?: unknown }>;
    }>;
  }>) {
    const comp = event.competitions[0];
    const us = comp.competitors.find((c) => String(c.team?.id) === teamId);
    const them = comp.competitors.find((c) => String(c.team?.id) !== teamId);
    if (!us || !them) continue;

    const venue = us.homeAway === 'home' ? totals.home : totals.road;
    addGame(totals.season, us, them);
    addGame(venue, us, them);
    if (last5Ids.has(event.id)) {
      addGame(totals.last5, us, them);
    }

    try {
      const sumRes = await fetch(
        `${scheduleBaseUrl.replace('/teams', '')}/summary?event=${event.id}`,
        { headers: FETCH_HEADERS },
      );
      if (!sumRes.ok) continue;
      const summary = await sumRes.json();
      const teams = summary.boxscore?.teams ?? [];
      const teamBox = teams.find((t: { team?: { id?: string } }) => String(t.team?.id) === teamId);
      const oppBox = teams.find((t: { team?: { id?: string } }) => String(t.team?.id) !== teamId);
      addBoxStats(totals.season, teamBox, oppBox);
      addBoxStats(venue, teamBox, oppBox);
      if (last5Ids.has(event.id)) {
        addBoxStats(totals.last5, teamBox, oppBox);
      }
    } catch {
      // Box score is optional; score-derived stats still exist.
    }
  }

  return totals.season.games > 0 ? totals : null;
}
