const COMPLETED_STATUSES = new Set([
  'STATUS_FINAL',
  'STATUS_FULL_TIME',
  'STATUS_END_OF_GAME',
]);
const REGULAR_SEASON_TYPE = 2;
const POSTSEASON_TYPE = 3;

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'sports-match-sync/1.0',
};

/** @param {unknown} score */
function parseScore(score) {
  if (score == null) return 0;
  if (typeof score === 'object' && score !== null && 'value' in score) {
    return Number.parseInt(String(score.value), 10) || 0;
  }
  return Number.parseInt(String(score), 10) || 0;
}

/** @param {string | number | null | undefined} value */
export function formatStreakDisplay(value) {
  if (value == null) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '—') return '—';
    const match = trimmed.match(/^([WLD])(\d+)$/i);
    if (match) return `${match[1].toUpperCase()}${match[2]}`;
    const n = Number(trimmed);
    if (!Number.isNaN(n)) return formatStreakNumber(n);
    return trimmed;
  }
  return formatStreakNumber(value);
}

/** @param {number} n */
function formatStreakNumber(n) {
  if (n === 0 || Number.isNaN(n)) return '—';
  if (n > 0) return `W${n}`;
  return `L${Math.abs(Math.trunc(n))}`;
}

/** @param {object} us @param {object} them */
function gameResult(us, them) {
  if (us.winner === true) return 'W';
  if (them.winner === true) return 'L';
  const usScore = parseScore(us.score);
  const themScore = parseScore(them.score);
  if (usScore > themScore) return 'W';
  if (usScore < themScore) return 'L';
  if (usScore === themScore && (us.score != null || them.score != null)) return 'T';
  if (us.winner === false && them.winner === false) return 'T';
  return null;
}

/** @param {object[]} events */
function sortEventsChronologically(events) {
  return [...events].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));
}

/** @param {object[]} events */
function dedupeScheduleEvents(events) {
  const byId = new Map();
  for (const event of events) {
    const key =
      event.id ??
      `${event.date ?? ''}-${event.competitions?.[0]?.competitors?.map((c) => c.team?.id).join('-') ?? ''}`;
    byId.set(key, event);
  }
  return [...byId.values()];
}

/** @param {'W'|'L'|'T'} result @param {number} count */
function streakLabel(result, count) {
  const letter = result === 'T' ? 'D' : result;
  return `${letter}${count}`;
}

/** @param {object[]} events @param {string} teamId */
export function computeStreakFromScheduleEvents(events, teamId) {
  const results = [];
  for (const event of sortEventsChronologically(events)) {
    const comp = event.competitions[0];
    const us = comp?.competitors?.find((c) => String(c.team?.id) === teamId);
    const them = comp?.competitors?.find((c) => String(c.team?.id) !== teamId);
    if (!us || !them) continue;
    const result = gameResult(us, them);
    if (result) results.push(result);
  }
  if (results.length === 0) return '—';
  const latest = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] !== latest) break;
    count++;
  }
  return streakLabel(latest, count);
}

/** @param {object[]} events */
function filterFinalEvents(events) {
  return events.filter((event) => {
    const status = event.competitions?.[0]?.status?.type?.name ?? '';
    return COMPLETED_STATUSES.has(status);
  });
}

/** @param {string} teamsUrl @param {string} teamId @param {string} sport @param {number} seasonType */
function scheduleUrls(teamsUrl, teamId, sport, seasonType) {
  if (sport === 'NFL' || sport === 'NCAAF') {
    const now = new Date();
    const primary = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return [primary, primary - 1].map(
      (season) => `${teamsUrl}/${teamId}/schedule?season=${season}&seasontype=${seasonType}`,
    );
  }
  if (sport === 'MLS') {
    if (seasonType === POSTSEASON_TYPE) {
      return [`${teamsUrl}/${teamId}/schedule?seasontype=${seasonType}`];
    }
    return [`${teamsUrl}/${teamId}/schedule`];
  }
  return [`${teamsUrl}/${teamId}/schedule?seasontype=${seasonType}`];
}

/** @param {string} teamsUrl @param {string} teamId @param {string} sport @param {number} seasonType */
async function fetchFinalEventsForSeasonType(teamsUrl, teamId, sport, seasonType) {
  for (const url of scheduleUrls(teamsUrl, teamId, sport, seasonType)) {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) continue;
    const data = await res.json();
    const events = filterFinalEvents(data.events ?? []);
    if (events.length > 0) return events;
  }
  return [];
}

/** @param {string} teamsUrl @param {string} teamId @param {string} sport */
async function fetchFinalScheduleEvents(teamsUrl, teamId, sport) {
  const regular = await fetchFinalEventsForSeasonType(
    teamsUrl,
    teamId,
    sport,
    REGULAR_SEASON_TYPE,
  );
  const postseason = await fetchFinalEventsForSeasonType(
    teamsUrl,
    teamId,
    sport,
    POSTSEASON_TYPE,
  );

  if (postseason.length > 0) {
    return dedupeScheduleEvents([...regular, ...postseason]);
  }

  return regular;
}

/** @param {string} teamId @param {string} teamsUrl @param {string} sport */
export async function fetchTeamStreak(teamId, teamsUrl, sport) {
  const events = await fetchFinalScheduleEvents(teamsUrl, teamId, sport);
  return computeStreakFromScheduleEvents(events, teamId);
}
