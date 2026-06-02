/**
 * Shared ESPN → Supabase sync runner for a league.
 *
 * @param {object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabase
 * @param {string} config.sport e.g. MLB, NBA
 * @param {string} config.idLikePattern e.g. espn-% or espn-nba-%
 * @param {string} config.teamsTable e.g. mlb_teams
 * @param {string} config.syncRunsTable e.g. mlb_sync_runs
 * @param {() => Promise<object[]>} config.fetchTeams
 * @param {(rows: object[]) => Map<string, object>} config.buildTeamLookup
 * @param {(days: number, anchor: Date, lookup: Map<string, object>) => Promise<object[]>} config.fetchScheduleWindow
 * @param {(date: Date, lookup: Map<string, object>) => Promise<object[]>} config.fetchScoreboardForDate
 * @param {(rows: object[]) => boolean} config.hasActiveGames
 * @param {boolean} config.isLive
 */

import { getDateWindow, toISODateLocal } from './dates.mjs';
import { attachStatsToRow, fetchLeagueStatsCache } from './espn-stats.mjs';
import { enrichRowsWithTeamRecords } from './espn-team-record.mjs';

const DAYS = 7;

/** @param {object} config @param {'daily'|'live'} syncType */
async function logRunStart(config, syncType) {
  const { data, error } = await config.supabase
    .from(config.syncRunsTable)
    .insert({ sync_type: syncType })
    .select('id')
    .single();
  if (error) {
    if (error.code === 'PGRST205' || error.message.includes(config.syncRunsTable)) {
      console.warn(`${config.syncRunsTable} missing — apply migrations to enable sync logging.`);
      return null;
    }
    throw new Error(`Sync log insert failed: ${error.message}`);
  }
  return data.id;
}

/** @param {object} config @param {number | null} runId @param {object} patch */
async function logRunFinish(config, runId, patch) {
  if (runId == null) return;
  const { error } = await config.supabase
    .from(config.syncRunsTable)
    .update({ finished_at: new Date().toISOString(), ...patch })
    .eq('id', runId);
  if (error) console.warn('Sync log update failed:', error.message);
}

/** @param {object} row */
function baseRow(row) {
  return {
    id: row.id,
    sport: row.sport,
    away_team: row.away_team,
    home_team: row.home_team,
    start_time: row.start_time,
    location: row.location,
    week_label: row.week_label,
    game_date: row.game_date,
    stats: row.stats,
  };
}

/** @param {object} config @param {object[]} rows */
async function upsertScheduleRows(config, rows) {
  if (rows.length === 0) return 0;
  let { error } = await config.supabase.from('matches').upsert(rows, { onConflict: 'id' });
  if (
    error &&
    (error.code === 'PGRST204' ||
      error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    console.warn(`Extended columns missing — upserting base fields only for ${config.sport}.`);
    ({ error } = await config.supabase
      .from('matches')
      .upsert(rows.map(baseRow), { onConflict: 'id' }));
  }
  if (error) throw new Error(`Upsert failed: ${error.message}`);
  return rows.length;
}

/** @param {object} config */
async function syncTeamsDirectory(config) {
  const teams = await config.fetchTeams();
  const { error } = await config.supabase
    .from(config.teamsTable)
    .upsert(teams, { onConflict: 'espn_id' });
  if (error) {
    if (error.code === 'PGRST205' || error.message.includes(config.teamsTable)) {
      console.warn(`${config.teamsTable} missing — apply team migration. Logos skipped.`);
      return config.buildTeamLookup(teams);
    }
    throw new Error(`${config.sport} teams upsert failed: ${error.message}`);
  }
  console.log(`Synced ${teams.length} ${config.sport} teams (logos + metadata).`);
  return config.buildTeamLookup(teams);
}

/** @param {object} config */
async function loadTeamLookupFromDb(config) {
  const { data, error } = await config.supabase.from(config.teamsTable).select('*');
  if (error || !data?.length) {
    const teams = await config.fetchTeams();
    return config.buildTeamLookup(teams);
  }
  return config.buildTeamLookup(data);
}

/** @param {object} config — removes all rows for this sport (ESPN + old seed data). */
async function deleteCachedEspnGames(config) {
  const { error } = await config.supabase
    .from('matches')
    .delete()
    .eq('sport', config.sport);
  if (error) throw new Error(`Delete stale ${config.sport} failed: ${error.message}`);
}

/** @param {object} config */
export async function runDailySync(config) {
  const runId = await logRunStart(config, 'daily');
  try {
    const windowDates = getDateWindow(DAYS).map(toISODateLocal);
    const teamLookup = await syncTeamsDirectory(config);
    const rows = await config.fetchScheduleWindow(DAYS, new Date(), teamLookup);

    let enrichedRows = rows;
    try {
      if (config.teamsUrl) {
        enrichedRows = await enrichRowsWithTeamRecords(enrichedRows, config.sport, config.teamsUrl);
      }
    } catch (recordError) {
      const message = recordError instanceof Error ? recordError.message : String(recordError);
      console.warn(`${config.sport} team record enrichment skipped: ${message}`);
    }
    try {
      const statsCache = await fetchLeagueStatsCache(config.sport, config.fetchTeams);
      enrichedRows = enrichedRows.map((row) => attachStatsToRow(config.sport, row, statsCache));
      const withStats = enrichedRows.filter((row) => row.stats?.length > 0).length;
      console.log(`Attached season stats to ${withStats}/${rows.length} ${config.sport} games.`);
    } catch (statsError) {
      const message = statsError instanceof Error ? statsError.message : String(statsError);
      console.warn(`${config.sport} stats enrichment skipped: ${message}`);
    }

    await deleteCachedEspnGames(config);

    const upserted = await upsertScheduleRows(config, enrichedRows);
    console.log(
      `Daily ${config.sport} sync: ${upserted} games (${windowDates[0]} → ${windowDates[windowDates.length - 1]})`,
    );
    await logRunFinish(config, runId, { games_upserted: upserted, games_updated: 0 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logRunFinish(config, runId, { error: message });
    throw e;
  }
}

/** @param {object} config */
export async function runLiveSync(config) {
  const runId = await logRunStart(config, 'live');
  try {
    const today = new Date();
    const teamLookup = await loadTeamLookupFromDb(config);
    const rows = await config.fetchScoreboardForDate(today, teamLookup);

    if (!config.hasActiveGames(rows)) {
      const { data: existing, error: existingError } = await config.supabase
        .from('matches')
        .select('id')
        .eq('sport', config.sport)
        .eq('game_date', toISODateLocal(today))
        .like('id', config.idLikePattern)
        .limit(1);
      if (existingError?.message?.includes('game_date')) {
        console.log(`Live ${config.sport} sync: game_date column missing — skipped`);
        await logRunFinish(config, runId, { games_upserted: 0, games_updated: 0 });
        return;
      }
      if (!existing?.length) {
        console.log(`Live ${config.sport} sync: no active games — skipped`);
        await logRunFinish(config, runId, { games_upserted: 0, games_updated: 0 });
        return;
      }
    }

    let scheduleRows = rows;
    try {
      if (config.teamsUrl) {
        scheduleRows = await enrichRowsWithTeamRecords(scheduleRows, config.sport, config.teamsUrl);
      }
    } catch (recordError) {
      const message = recordError instanceof Error ? recordError.message : String(recordError);
      console.warn(`${config.sport} team record enrichment skipped: ${message}`);
    }

    let updated = 0;
    for (const row of scheduleRows) {
      const { data: current } = await config.supabase
        .from('matches')
        .select('stats')
        .eq('id', row.id)
        .maybeSingle();

      const payload = {
        start_time: row.start_time,
        location: row.location,
        game_status: row.game_status,
        status_detail: row.status_detail,
        away_score: row.away_score,
        home_score: row.home_score,
        synced_at: row.synced_at,
        away_team: row.away_team,
        home_team: row.home_team,
      };

      if (current) {
        let { error } = await config.supabase.from('matches').update(payload).eq('id', row.id);
        if (error?.message?.includes('game_status')) {
          ({ error } = await config.supabase
            .from('matches')
            .update({
              start_time: row.start_time,
              location: row.location,
              away_team: row.away_team,
              home_team: row.home_team,
            })
            .eq('id', row.id));
        }
        if (error) throw new Error(`Update ${row.id}: ${error.message}`);
        updated += 1;
      } else {
        let { error } = await config.supabase.from('matches').insert(row);
        if (error?.message?.includes('source')) {
          ({ error } = await config.supabase.from('matches').insert(baseRow(row)));
        }
        if (error) throw new Error(`Insert ${row.id}: ${error.message}`);
        updated += 1;
      }
    }

    console.log(`Live ${config.sport} sync: updated ${updated} games for ${toISODateLocal(today)}`);
    await logRunFinish(config, runId, { games_upserted: 0, games_updated: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logRunFinish(config, runId, { error: message });
    throw e;
  }
}

/** @param {object} config */
export async function runEspnSync(config) {
  if (config.isLive) {
    await runLiveSync(config);
  } else {
    await runDailySync(config);
  }
}
