import {
  gameDateFromEventStart,
  isDateInRange,
  toEspnDateParam,
  toISODateLocal,
  weekLabelForDate,
} from './dates.mjs';
import { applyTeamLookup, teamColor } from './espn-team-utils.mjs';

/** @param {string} espnStatusName */
export function mapGameStatus(espnStatusName) {
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

/** @param {Array<{ type?: string; summary?: string }> | undefined} records */
function parseRecord(records) {
  const overall =
    records?.find((r) => r.type === 'total')?.summary ??
    records?.[0]?.summary ??
    '—';
  return {
    overall,
    winPct: '—',
    points: '—',
    streak: '—',
  };
}

/** @param {object} competitor @param {Map<string, object> | undefined} teamLookup */
function mapTeam(competitor, teamLookup) {
  const team = competitor.team ?? {};
  const base = {
    id: String(team.id ?? competitor.id ?? team.abbreviation ?? 'unknown'),
    name: team.displayName ?? team.name ?? 'TBD',
    abbreviation: team.abbreviation ?? '—',
    color: teamColor(team.color),
    record: parseRecord(competitor.records),
  };
  return applyTeamLookup(base, teamLookup);
}

/** @param {string} iso */
function formatStartTime(iso) {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** @param {object} venue */
function formatLocation(venue) {
  if (!venue) return 'TBD';
  const city = venue.address?.city;
  const state = venue.address?.state;
  if (city && state) return `${city}, ${state}`;
  return venue.fullName ?? 'TBD';
}

/**
 * @param {object} config
 * @param {string} config.sport
 * @param {string} config.idPrefix
 * @param {string} config.scoreboardUrl
 * @param {'daily'|'range'} [config.scheduleStrategy]
 * @param {number} [config.rangeLookaheadDays] wider fetch for sparse leagues (MLS)
 */
export function createEspnScheduleApi(config) {
  const {
    sport,
    idPrefix,
    scoreboardUrl,
    scheduleStrategy = 'daily',
    rangeLookaheadDays = 14,
  } = config;

  /** @param {object} event @param {Map<string, object> | undefined} teamLookup */
  function mapEspnEventToRow(event, teamLookup) {
    const competition = event.competitions?.[0];
    if (!competition) return null;

    const competitors = competition.competitors ?? [];
    const away = competitors.find((c) => c.homeAway === 'away');
    const home = competitors.find((c) => c.homeAway === 'home');
    if (!away || !home) return null;

    const statusType = competition.status?.type ?? event.status?.type ?? {};
    const statusName = statusType.name ?? '';
    const gameStatus = mapGameStatus(statusName);
    const statusDetail =
      statusType.shortDetail ?? statusType.detail ?? statusType.description ?? null;

    const awayScoreRaw = away.score;
    const homeScoreRaw = home.score;
    const hasScore =
      awayScoreRaw !== undefined &&
      homeScoreRaw !== undefined &&
      gameStatus !== 'scheduled' &&
      statusName !== 'STATUS_SCHEDULED' &&
      statusName !== 'STATUS_NOT_STARTED';

    const startIso = competition.startDate ?? event.date;
    const gameDate = gameDateFromEventStart(startIso);
    if (!gameDate) return null;

    return {
      id: `${idPrefix}-${event.id}`,
      sport,
      espn_event_id: String(event.id),
      away_team: mapTeam(away, teamLookup),
      home_team: mapTeam(home, teamLookup),
      start_time: formatStartTime(startIso),
      location: formatLocation(competition.venue),
      week_label: weekLabelForDate(gameDate),
      game_date: gameDate,
      stats: [],
      game_status: gameStatus,
      status_detail: statusDetail,
      away_score: hasScore ? Number.parseInt(String(awayScoreRaw), 10) : null,
      home_score: hasScore ? Number.parseInt(String(homeScoreRaw), 10) : null,
      source: 'espn',
      synced_at: new Date().toISOString(),
    };
  }

  /** @param {object[]} events @param {Map<string, object> | undefined} teamLookup */
  function mapEvents(events, teamLookup) {
    const rows = [];
    for (const event of events) {
      const row = mapEspnEventToRow(event, teamLookup);
      if (row) rows.push(row);
    }
    return rows;
  }

  /** @param {Date} start @param {Date} end @param {Map<string, object> | undefined} teamLookup */
  async function fetchScoreboardForRange(start, end, teamLookup) {
    const startParam = toEspnDateParam(start);
    const endParam = toEspnDateParam(end);
    const url = `${scoreboardUrl}?dates=${startParam}-${endParam}&limit=200`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'sports-match-sync/1.0' },
    });
    if (!res.ok) {
      throw new Error(
        `ESPN ${sport} scoreboard ${startParam}-${endParam} failed: ${res.status} ${res.statusText}`,
      );
    }
    const data = await res.json();
    return mapEvents(data.events ?? [], teamLookup);
  }

  /** @param {Date} date @param {Map<string, object> | undefined} teamLookup */
  async function fetchScoreboardForDate(date, teamLookup) {
    const dayIso = toISODateLocal(date);
    const rows = await fetchScoreboardForRange(date, date, teamLookup);
    return rows.filter((row) => row.game_date === dayIso);
  }

  /** @param {number} [days] @param {Date} [anchor] @param {Map<string, object> | undefined} teamLookup */
  async function fetchScheduleWindow(days = 7, anchor = new Date(), teamLookup) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const windowEnd = new Date(start);
    windowEnd.setDate(windowEnd.getDate() + days - 1);
    const windowStartIso = toISODateLocal(start);
    const windowEndIso = toISODateLocal(windowEnd);

    if (scheduleStrategy === 'range') {
      const fetchEnd = new Date(start);
      fetchEnd.setDate(fetchEnd.getDate() + rangeLookaheadDays - 1);
      const rows = await fetchScoreboardForRange(start, fetchEnd, teamLookup);
      const byId = new Map();
      for (const row of rows) {
        if (isDateInRange(row.game_date, windowStartIso, windowEndIso)) {
          byId.set(row.id, row);
        }
      }
      return [...byId.values()].sort((a, b) =>
        a.game_date.localeCompare(b.game_date) || a.start_time.localeCompare(b.start_time),
      );
    }

    const allRows = [];
    const byId = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const rows = await fetchScoreboardForDate(d, teamLookup);
      for (const row of rows) {
        byId.set(row.id, row);
      }
    }
    return [...byId.values()].sort((a, b) =>
      a.game_date.localeCompare(b.game_date) || a.start_time.localeCompare(b.start_time),
    );
  }

  /** @param {object[]} rows */
  function hasActiveGames(rows) {
    return rows.some(
      (r) => r.game_status === 'in_progress' || r.game_status === 'scheduled',
    );
  }

  return { fetchScoreboardForDate, fetchScheduleWindow, hasActiveGames };
}
