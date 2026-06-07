import type { GameStatus, Match, Sport, StatRow, TeamSummary } from '../types';

export type MatchRow = {
  id: string;
  sport: Sport;
  away_team: TeamSummary;
  home_team: TeamSummary;
  start_time: string;
  location: string;
  week_label: string;
  game_date: string | null;
  espn_event_id: string | null;
  game_status: GameStatus | string | null;
  status_detail: string | null;
  away_score: number | null;
  home_score: number | null;
  source: 'seed' | 'espn' | string;
  synced_at: string | null;
  stats: StatRow[];
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      matches: {
        Row: MatchRow;
        Insert: Omit<MatchRow, 'created_at'>;
        Update: Partial<Omit<MatchRow, 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function rowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    sport: row.sport,
    awayTeam: row.away_team,
    homeTeam: row.home_team,
    startTime: row.start_time,
    location: row.location,
    weekLabel: row.week_label,
    gameDate: row.game_date ?? '',
    gameStatus: (row.game_status as GameStatus | null) ?? undefined,
    statusDetail: row.status_detail,
    awayScore: row.away_score,
    homeScore: row.home_score,
    source: row.source === 'espn' ? 'espn' : 'seed',
    espnEventId: row.espn_event_id,
    stats: row.stats,
  };
}
