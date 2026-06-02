export type Sport = 'NFL' | 'MLB' | 'MLS' | 'NBA' | 'NHL' | 'WNBA' | 'NCAAB' | 'NCAAW';

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'final'
  | 'postponed'
  | 'delayed'
  | 'canceled'
  | 'suspended'
  | 'unknown';

export interface TeamRecord {
  overall: string;
  winPct: string;
  points: string;
  streak: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  /** ESPN CDN logo URL (from mlb_teams cache). */
  logoUrl?: string;
  record: TeamRecord;
}

export interface StatRow {
  id: string;
  label: string;
  awaySeason: number;
  awaySplit: number | null;
  awayLast5: number | null;
  awayL5Rank: number;
  homeSeason: number;
  homeSplit: number | null;
  homeLast5: number | null;
  homeL5Rank: number;
  /** true = away has advantage, false = home, null = tie */
  awayAdvantage: boolean | null;
  format?: 'decimal' | 'percent' | 'integer';
}

export interface Match {
  id: string;
  sport: Sport;
  awayTeam: TeamSummary;
  homeTeam: TeamSummary;
  startTime: string;
  location: string;
  weekLabel: string;
  /** Local calendar date (YYYY-MM-DD) for day filtering. */
  gameDate: string;
  /** Live schedule fields (ESPN sync). */
  gameStatus?: GameStatus;
  statusDetail?: string | null;
  awayScore?: number | null;
  homeScore?: number | null;
  source?: 'seed' | 'espn';
  stats: StatRow[];
}
