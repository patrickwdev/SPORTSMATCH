import { fetchTeamStreak, formatStreakDisplay } from './espn-streak.mjs';

const FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'sports-match-sync/1.0',
};

/** @param {number | undefined | null} value */
export function formatWinPct(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const pct = n > 1 ? n / 100 : n;
  if (pct >= 1) return '1.000';
  const fixed = pct.toFixed(3);
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

/** @param {string | undefined} summary @param {string} [sport] */
export function winPctFromRecordSummary(summary, sport) {
  if (!summary || summary === '—') return '—';
  const parts = summary.split('-').map((p) => Number.parseInt(p.trim(), 10));
  if (parts.some((n) => Number.isNaN(n))) return '—';

  let pct = null;
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

/** @param {Record<string, number>} stats @param {string} sport */
function formatPoints(stats, sport) {
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

/** @param {Record<string, number>} stats */
function formatStreak(stats) {
  const streak = stats.streak;
  if (streak == null || streak === 0) return '—';
  return formatStreakDisplay(streak);
}

/**
 * @param {string} summary
 * @param {Record<string, number>} stats
 * @param {string} sport
 */
export function buildTeamRecord(summary, stats, sport) {
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
  };
}

const EMPTY_RECORD = {
  overall: '—',
  winPct: '—',
  points: '—',
  streak: '—',
};

/**
 * @param {Array<{ type?: string; summary?: string; stats?: Array<{ name: string; value: number }> }>} | undefined} competitorRecords
 * @param {object | undefined} teamDetailRecord
 * @param {string} sport
 */
export function parseTeamRecord(competitorRecords, teamDetailRecord, sport) {
  const overallFromCompetitor =
    competitorRecords?.find((r) => r.type === 'total')?.summary ??
    competitorRecords?.[0]?.summary;

  if (teamDetailRecord?.items?.length) {
    const overall =
      teamDetailRecord.items.find((i) => i.type === 'total') ?? teamDetailRecord.items[0];
    const summary = overall.summary ?? overallFromCompetitor ?? '—';
    const stats = Object.fromEntries((overall.stats ?? []).map((s) => [s.name, s.value]));
    return buildTeamRecord(summary, stats, sport);
  }

  const summary = overallFromCompetitor ?? '—';
  return {
    overall: summary,
    winPct: winPctFromRecordSummary(summary, sport),
    points: '—',
    streak: '—',
  };
}

/** @param {string} teamsUrl @param {string} teamId */
export async function fetchTeamDetailRecord(teamsUrl, teamId) {
  const res = await fetch(`${teamsUrl}/${teamId}`, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return data.team?.record ?? null;
}

/** @param {string} teamsUrl @param {string[]} teamIds @param {string} sport */
export async function fetchLeagueRecordCache(teamsUrl, teamIds, sport) {
  const unique = [...new Set(teamIds.map(String))];
  const entries = await Promise.all(
    unique.map(async (teamId) => {
      const record = await fetchTeamDetailRecord(teamsUrl, teamId);
      return [teamId, record];
    }),
  );
  const cache = new Map();
  for (const [teamId, record] of entries) {
    cache.set(teamId, record);
  }
  return cache;
}

/**
 * @param {object} row
 * @param {string} sport
 * @param {string} teamsUrl
 * @param {Map<string, object>} recordCache
 */
export function enrichRowTeamRecords(row, sport, recordCache) {
  const awayId = String(row.away_team?.id ?? '');
  const homeId = String(row.home_team?.id ?? '');

  const awayRecord = parseTeamRecord(
    [{ type: 'total', summary: row.away_team?.record?.overall }],
    recordCache.get(awayId),
    sport,
  );
  const homeRecord = parseTeamRecord(
    [{ type: 'total', summary: row.home_team?.record?.overall }],
    recordCache.get(homeId),
    sport,
  );

  return {
    ...row,
    away_team: { ...row.away_team, record: awayRecord },
    home_team: { ...row.home_team, record: homeRecord },
  };
}

/** @param {string} teamsUrl @param {string[]} teamIds @param {string} sport */
async function fetchLeagueStreakCache(teamsUrl, teamIds, sport) {
  const unique = [...new Set(teamIds.map(String))];
  const entries = await Promise.all(
    unique.map(async (teamId) => {
      const streak = await fetchTeamStreak(teamId, teamsUrl, sport);
      return [teamId, streak];
    }),
  );
  return new Map(entries);
}

/** @param {object[]} rows @param {string} sport @param {string} teamsUrl */
export async function enrichRowsWithTeamRecords(rows, sport, teamsUrl) {
  if (!rows.length || !teamsUrl) return rows;

  const teamIds = rows.flatMap((r) => [r.away_team?.id, r.home_team?.id]).filter(Boolean);
  const [recordCache, streakCache] = await Promise.all([
    fetchLeagueRecordCache(teamsUrl, teamIds, sport),
    fetchLeagueStreakCache(teamsUrl, teamIds, sport),
  ]);

  return rows.map((row) => {
    const enriched = enrichRowTeamRecords(row, sport, recordCache);
    const awayId = String(enriched.away_team?.id ?? '');
    const homeId = String(enriched.home_team?.id ?? '');
    const awayStreak = streakCache.get(awayId);
    const homeStreak = streakCache.get(homeId);
    return {
      ...enriched,
      away_team: {
        ...enriched.away_team,
        record: {
          ...enriched.away_team.record,
          ...(awayStreak && awayStreak !== '—' ? { streak: awayStreak } : {}),
        },
      },
      home_team: {
        ...enriched.home_team,
        record: {
          ...enriched.home_team.record,
          ...(homeStreak && homeStreak !== '—' ? { streak: homeStreak } : {}),
        },
      },
    };
  });
}

export { EMPTY_RECORD };
