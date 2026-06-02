/** NHL team record + game logs — ESPN statistics splits are empty for hockey. */

const FINAL_STATUSES = new Set(['STATUS_FINAL', 'STATUS_END_PERIOD', 'STATUS_END_OF_GAME']);

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'sports-match-sync/1.0',
};

function emptyBucket() {
  return {
    games: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    powerPlayGoals: 0,
    shotsTotal: 0,
    penaltyMinutes: 0,
    blockedShots: 0,
    faceoffsWon: 0,
    faceoffsLost: 0,
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

/** @param {{ statistics?: Array<{ name: string; value?: number; displayValue?: string }> } | undefined} teamBox @param {string} name */
function boxStatValue(teamBox, name) {
  const stat = teamBox?.statistics?.find((s) => s.name === name);
  if (stat?.value != null && !Number.isNaN(Number(stat.value))) return Number(stat.value);
  if (stat?.displayValue != null) {
    const n = Number.parseFloat(String(stat.displayValue));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/** @param {object} bucket @param {object} us @param {object} them */
function addScheduleScores(bucket, us, them) {
  bucket.games += 1;
  bucket.goalsFor += parseScore(us.score);
  bucket.goalsAgainst += parseScore(them.score);
}

/** @param {object} bucket @param {object} teamBox @param {object} oppBox */
function addBoxStats(bucket, teamBox, oppBox) {
  bucket.powerPlayGoals += boxStatValue(teamBox, 'powerPlayGoals');
  bucket.shotsTotal += boxStatValue(teamBox, 'shotsTotal');
  bucket.penaltyMinutes += boxStatValue(teamBox, 'penaltyMinutes');
  bucket.blockedShots += boxStatValue(teamBox, 'blockedShots');
  bucket.faceoffsWon += boxStatValue(teamBox, 'faceoffsWon');
  bucket.faceoffsLost += boxStatValue(oppBox, 'faceoffsWon');
}

/** @param {Array<{ type?: string; stats?: Array<{ name: string; value: number }> }>} items */
export function parseNhlRecordSplits(items) {
  const toStats = (item) =>
    item.stats ? Object.fromEntries(item.stats.map((s) => [s.name, s.value])) : null;

  const home = items.find((i) => i.type === 'home');
  const road = items.find((i) => i.type === 'road' || i.type === 'away');
  return {
    home: home ? toStats(home) : null,
    road: road ? toStats(road) : null,
  };
}

/** @param {Record<string, number> | null} record @param {'avgPointsFor'|'avgPointsAgainst'|'powerPlayGoalsPerGame'} splitKind */
export function extractNhlRecordSplitValue(record, splitKind) {
  if (!record) return null;

  if (splitKind === 'avgPointsFor' || splitKind === 'avgPointsAgainst') {
    const avg = record[splitKind];
    if (avg != null && !Number.isNaN(Number(avg))) return Number(avg);
    const totalKey = splitKind === 'avgPointsFor' ? 'pointsFor' : 'pointsAgainst';
    const gp = Number(record.gamesPlayed);
    const total = Number(record[totalKey]);
    if (gp > 0 && !Number.isNaN(total)) return total / gp;
    return null;
  }

  const gp = Number(record.gamesPlayed);
  const pp = Number(record.powerPlayGoals);
  if (gp > 0 && !Number.isNaN(pp)) return pp / gp;
  return null;
}

/** @param {object | null} bucket @param {string} kind */
export function extractNhlBucketValue(bucket, kind) {
  if (!bucket || bucket.games <= 0) return null;
  const gp = bucket.games;
  switch (kind) {
    case 'goalsFor':
      return bucket.goalsFor / gp;
    case 'goalsAgainst':
      return bucket.goalsAgainst / gp;
    case 'powerPlayGoals':
      return bucket.powerPlayGoals / gp;
    case 'shotsTotal':
      return bucket.shotsTotal / gp;
    case 'penaltyMinutes':
      return bucket.penaltyMinutes / gp;
    case 'blockedShots':
      return bucket.blockedShots / gp;
    case 'shootingPct':
      return bucket.shotsTotal > 0 ? (bucket.goalsFor / bucket.shotsTotal) * 100 : null;
    case 'faceoffsWon':
      return bucket.faceoffsWon / gp;
    case 'faceoffPct': {
      const taken = bucket.faceoffsWon + bucket.faceoffsLost;
      return taken > 0 ? (bucket.faceoffsWon / taken) * 100 : null;
    }
    default:
      return null;
  }
}

/** @param {object | null} totals @param {'season'|'home'|'away'|'last7'} split @param {string} kind */
export function extractNhlGameTotalsValue(totals, split, kind) {
  if (!totals) return null;
  const bucket =
    split === 'season'
      ? totals.season
      : split === 'home'
        ? totals.home
        : split === 'away'
          ? totals.road
          : totals.last5;
  return extractNhlBucketValue(bucket, kind);
}

/** @deprecated Use extractNhlBucketValue */
export function extractNhlLast5Value(last5, kind) {
  return extractNhlBucketValue(last5, kind);
}

/** @param {string} teamId @param {string} scheduleBaseUrl */
export async function fetchNhlGameTotals(teamId, scheduleBaseUrl) {
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

  await Promise.all(
    events.map(async (event) => {
      const comp = event.competitions[0];
      const us = comp.competitors.find((c) => String(c.team?.id) === teamId);
      const them = comp.competitors.find((c) => String(c.team?.id) !== teamId);
      if (!us || !them) return;

      const venue = us.homeAway === 'home' ? totals.home : totals.road;
      addScheduleScores(totals.season, us, them);
      addScheduleScores(venue, us, them);
      if (last5Ids.has(event.id)) {
        addScheduleScores(totals.last5, us, them);
      }

      try {
        const sumRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${event.id}`,
          { headers: FETCH_HEADERS },
        );
        if (!sumRes.ok) return;
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
        // Box score optional; goals still count from schedule.
      }
    }),
  );

  return totals.season.games > 0 ? totals : null;
}

/** @param {string} teamId @param {string} scheduleBaseUrl */
export async function fetchNhlLast5Totals(teamId, scheduleBaseUrl) {
  const totals = await fetchNhlGameTotals(teamId, scheduleBaseUrl);
  return totals?.last5.games ? totals.last5 : null;
}

/** @param {string} teamsUrl @param {string} teamId */
export async function fetchNhlRecordSplits(teamsUrl, teamId) {
  const res = await fetch(`${teamsUrl}/${teamId}`, { headers: FETCH_HEADERS });
  if (!res.ok) return { home: null, road: null };
  const data = await res.json();
  return parseNhlRecordSplits(data.team?.record?.items ?? []);
}
