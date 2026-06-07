export type Sport =
  | 'NFL'
  | 'NCAAF'
  | 'MLB'
  | 'MLS'
  | 'NBA'
  | 'NHL'
  | 'WNBA'
  | 'NCAAB'
  | 'NCAAW';

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
  /** Home W-L when available. */
  homeRecord?: string;
  /** Away / road W-L when available. */
  awayRecord?: string;
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

export type GameResultLetter = 'W' | 'L' | 'T';

export interface TeamRecentGame {
  date: string;
  result: GameResultLetter;
  usScore: number;
  themScore: number;
  score: string;
  opponentAbbreviation: string;
  opponentLogoUrl?: string;
  venue: 'H' | 'A';
  moneyLine?: string | null;
  mlResult?: GameResultLetter | null;
  overUnderLine?: string | null;
  ouResult?: 'o' | 'u' | 'p' | null;
  starterName?: string | null;
  starterIp?: string | null;
  oppStarterName?: string | null;
  oppStarterIp?: string | null;
}

export interface TeamRecentSummary {
  winLoss: string;
  overUnder: string;
  mlProfit: string;
}

export interface HeadToHeadGame {
  date: string;
  awayAbbreviation: string;
  homeAbbreviation: string;
  awayScore: number;
  homeScore: number;
  winnerSide: 'away' | 'home' | 'tie';
  homeLogoUrl?: string;
  /** Match away team moneyline for this meeting. */
  awayMoneyLine?: string | null;
  awayMlResult?: GameResultLetter | null;
  overUnderLine?: string | null;
  ouResult?: 'o' | 'u' | 'p' | null;
  /** Match away team starter in this meeting. */
  matchAwayStarterName?: string | null;
  matchAwayStarterIp?: string | null;
  /** Match home team starter in this meeting. */
  matchHomeStarterName?: string | null;
  matchHomeStarterIp?: string | null;
}

export interface HeadToHeadRecord {
  awayWins: number;
  homeWins: number;
  ties: number;
}

export interface MatchHistory {
  awayRecent: TeamRecentGame[];
  homeRecent: TeamRecentGame[];
  awayRecentSummary: TeamRecentSummary;
  homeRecentSummary: TeamRecentSummary;
  headToHead: HeadToHeadGame[];
  headToHeadRecord: HeadToHeadRecord;
  headToHeadSummary: TeamRecentSummary;
}

export interface Match {
  id: string;
  sport: Sport;
  awayTeam: TeamSummary;
  homeTeam: TeamSummary;
  startTime: string;
  location: string;
  /** Kickoff weather line when available (football). */
  weather?: string | null;
  weekLabel: string;
  /** Local calendar date (YYYY-MM-DD) for day filtering. */
  gameDate: string;
  /** Live schedule fields (ESPN sync). */
  gameStatus?: GameStatus;
  statusDetail?: string | null;
  awayScore?: number | null;
  homeScore?: number | null;
  source?: 'seed' | 'espn';
  espnEventId?: string | null;
  stats: StatRow[];
}
