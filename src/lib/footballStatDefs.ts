import type { StatRow } from '../types';

type StatFormat = StatRow['format'];

export type FootballStatDef = {
  id: string;
  label: string;
  category?: string;
  name?: string;
  format?: StatFormat;
  scale?: number;
  perGame?: boolean;
  opponent?: boolean;
  lowerIsBetter?: boolean;
  footballGameLog?: FootballGameStatKind;
};

export type FootballGameStatKind =
  | 'pointsFor'
  | 'pointsAgainst'
  | 'netPassingYards'
  | 'oppNetPassingYards'
  | 'yardsPerPass'
  | 'completionPct'
  | 'rushingYards'
  | 'oppRushingYards'
  | 'yardsPerRush'
  | 'thirdDownPct'
  | 'oppThirdDownPct'
  | 'fourthDownPct'
  | 'giveaways'
  | 'takeaways'
  | 'penaltyYards';

/** Match-sheet rows shown on NFL / NCAAF dashboards. */
export const FOOTBALL_STAT_DEFS: FootballStatDef[] = [
  { id: '1', label: 'PPG', category: 'scoring', name: 'totalPointsPerGame', footballGameLog: 'pointsFor' },
  {
    id: '2',
    label: 'PPG/A',
    category: 'scoring',
    name: 'totalPointsPerGame',
    opponent: true,
    lowerIsBetter: true,
    footballGameLog: 'pointsAgainst',
  },
  {
    id: '3',
    label: 'Pass YPG',
    category: 'passing',
    name: 'netPassingYardsPerGame',
    footballGameLog: 'netPassingYards',
  },
  {
    id: '4',
    label: 'Pass YPG/A',
    category: 'passing',
    name: 'netPassingYardsPerGame',
    opponent: true,
    lowerIsBetter: true,
    footballGameLog: 'oppNetPassingYards',
  },
  {
    id: '5',
    label: 'Yards/Pass',
    category: 'passing',
    name: 'yardsPerPassAttempt',
    footballGameLog: 'yardsPerPass',
  },
  {
    id: '6',
    label: 'QB Comp%',
    category: 'passing',
    name: 'completionPct',
    format: 'percent',
    scale: 0.01,
    footballGameLog: 'completionPct',
  },
  {
    id: '7',
    label: 'Rush YPG',
    category: 'rushing',
    name: 'rushingYardsPerGame',
    footballGameLog: 'rushingYards',
  },
  {
    id: '8',
    label: 'Rush YPG/A',
    category: 'rushing',
    name: 'rushingYardsPerGame',
    opponent: true,
    lowerIsBetter: true,
    footballGameLog: 'oppRushingYards',
  },
  {
    id: '9',
    label: 'Yards/Rush',
    category: 'rushing',
    name: 'yardsPerRushAttempt',
    footballGameLog: 'yardsPerRush',
  },
  {
    id: '10',
    label: '3rdDown%',
    category: 'miscellaneous',
    name: 'thirdDownConvPct',
    format: 'percent',
    scale: 0.01,
    footballGameLog: 'thirdDownPct',
  },
  {
    id: '11',
    label: '3rdDown%/A',
    category: 'miscellaneous',
    name: 'thirdDownConvPct',
    opponent: true,
    lowerIsBetter: true,
    format: 'percent',
    scale: 0.01,
    footballGameLog: 'oppThirdDownPct',
  },
  {
    id: '12',
    label: '4thDown%',
    category: 'miscellaneous',
    name: 'fourthDownConvPct',
    format: 'percent',
    scale: 0.01,
    footballGameLog: 'fourthDownPct',
  },
  {
    id: '13',
    label: 'Turnovers/G',
    category: 'miscellaneous',
    name: 'totalGiveaways',
    perGame: true,
    lowerIsBetter: true,
    footballGameLog: 'giveaways',
  },
  {
    id: '14',
    label: 'TakeAway/G',
    category: 'miscellaneous',
    name: 'totalTakeaways',
    perGame: true,
    footballGameLog: 'takeaways',
  },
  {
    id: '15',
    label: 'PenYards/G',
    category: 'miscellaneous',
    name: 'totalPenaltyYards',
    perGame: true,
    lowerIsBetter: true,
    footballGameLog: 'penaltyYards',
  },
];
