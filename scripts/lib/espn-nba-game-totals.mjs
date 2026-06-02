/** Basketball (NBA/WNBA/NCAAB/NCAAW) box-score aggregates from game logs (season, home, road, last 5). */

const FINAL_STATUSES = new Set(['STATUS_FINAL']);

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'sports-match-sync/1.0',
};

function emptyBucket() {
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

/** @param {unknown} score */
function parseScore(score) {
  if (score == null) return 0;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    return Number.parseInt(String(score.value), 10) || 0;
  }
  return Number.parseInt(String(score), 10) || 0;
}

/** @param {{ value?: unknown, displayValue?: unknown } | undefined} stat */
function parseStatNumber(stat) {
  if (!stat) return 0;
  if (stat.value != null && !Number.isNaN(Number(stat.value))) return Number(stat.value);
  if (stat.displayValue != null) {
    const n = Number.parseFloat(String(stat.displayValue).replace('%', ''));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/** @param {unknown} displayValue */
function parseMakesAttempts(displayValue) {
  if (displayValue == null) return { made: 0, attempted: 0 };
  const [madeRaw, attemptedRaw] = String(displayValue).split('-');
  return {
    made: Number.parseInt(madeRaw ?? '', 10) || 0,
    attempted: Number.parseInt(attemptedRaw ?? '', 10) || 0,
  };
}

/** @param {object} bucket @param {object} us @param {object} them */
function addGame(bucket, us, them) {
  bucket.games += 1;
  bucket.pointsFor += parseScore(us.score);
  bucket.pointsAgainst += parseScore(them.score);
}

/** @param {object} bucket @param {{ statistics?: Array<{ name: string, value?: unknown, displayValue?: unknown }> } | undefined} teamBox @param {{ statistics?: Array<{ name: string, value?: unknown, displayValue?: unknown }> } | undefined} oppBox */
function addBoxStats(bucket, teamBox, oppBox) {
  const getStat = (name) => teamBox?.statistics?.find((s) => s.name === name);
  const getOppStat = (name) => oppBox?.statistics?.find((s) => s.name === name);
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

/** @param {object | null} bucket @param {'pointsFor'|'pointsAgainst'|'totalRebounds'|'assists'|'fieldGoalsMade'|'fieldGoalPct'|'threePointFieldGoalPct'|'freeThrowPct'|'twoPointPct'|'oppTwoPointPct'|'oppThreePointPct'|'turnovers'|'steals'|'blocks'|'pace'} kind */
export function extractNbaBucketValue(bucket, kind) {
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

/** @param {object | null} totals @param {'season'|'home'|'away'|'last7'} split @param {'pointsFor'|'pointsAgainst'|'totalRebounds'|'assists'|'fieldGoalsMade'|'fieldGoalPct'|'threePointFieldGoalPct'|'freeThrowPct'|'twoPointPct'|'oppTwoPointPct'|'oppThreePointPct'|'turnovers'|'steals'|'blocks'|'pace'} kind */
export function extractNbaGameTotalsValue(totals, split, kind) {
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

/** @param {string} teamId @param {string} scheduleBaseUrl */
export async function fetchNbaGameTotals(teamId, scheduleBaseUrl) {
  const schedRes = await fetch(`${scheduleBaseUrl}/${teamId}/schedule?seasontype=2`, {
    headers: FETCH_HEADERS,
  });
  if (!schedRes.ok) return null;

  const schedData = await schedRes.json();
  const events = (schedData.events ?? []).filter((event) => {
    const status = event.competitions?.[0]?.status?.type?.name ?? '';
    return FINAL_STATUSES.has(status);
  });

  if (events.length === 0) return null;

  const last5Ids = new Set(events.slice(-5).map((e) => e.id));
  const totals = {
    season: emptyBucket(),
    home: emptyBucket(),
    road: emptyBucket(),
    last5: emptyBucket(),
  };

  for (const event of events) {
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
      const teamBox = teams.find((t) => String(t.team?.id) === teamId);
      const oppBox = teams.find((t) => String(t.team?.id) !== teamId);
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
