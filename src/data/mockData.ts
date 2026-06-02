import type { Match, Sport, StatRow, TeamSummary } from '../types';
import { gameDateFromToday } from '../utils/dates';

function mlbLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

function nflLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

function nbaLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

function nhlLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

function mlsLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

function wnbaLogoUrl(abbreviation: string): string {
  return `https://a.espncdn.com/i/teamlogos/wnba/500/scoreboard/${abbreviation.toLowerCase()}.png`;
}

const nflTeams: Record<string, TeamSummary> = {
  kc: { id: 'kc', name: 'Kansas City', abbreviation: 'KC', color: '#E31837', logoUrl: nflLogoUrl('KC'), record: { overall: '7-2-0', winPct: '.778', points: '—', streak: 'W3' } },
  buf: { id: 'buf', name: 'Buffalo', abbreviation: 'BUF', color: '#00338D', logoUrl: nflLogoUrl('BUF'), record: { overall: '6-3-0', winPct: '.667', points: '—', streak: 'L1' } },
  dal: { id: 'dal', name: 'Dallas', abbreviation: 'DAL', color: '#003594', logoUrl: nflLogoUrl('DAL'), record: { overall: '5-4-0', winPct: '.556', points: '—', streak: 'W1' } },
  phi: { id: 'phi', name: 'Philadelphia', abbreviation: 'PHI', color: '#004C54', logoUrl: nflLogoUrl('PHI'), record: { overall: '6-3-0', winPct: '.667', points: '—', streak: 'W2' } },
  sf: { id: 'sf', name: 'San Francisco', abbreviation: 'SF', color: '#AA0000', logoUrl: nflLogoUrl('SF'), record: { overall: '5-4-0', winPct: '.556', points: '—', streak: 'W1' } },
  sea: { id: 'sea', name: 'Seattle', abbreviation: 'SEA', color: '#002244', logoUrl: nflLogoUrl('SEA'), record: { overall: '4-5-0', winPct: '.444', points: '—', streak: 'L2' } },
};

const mlbTeams: Record<string, TeamSummary> = {
  nyy: { id: 'nyy', name: 'New York Yankees', abbreviation: 'NYY', color: '#003087', logoUrl: mlbLogoUrl('NYY'), record: { overall: '32-22', winPct: '.593', points: '—', streak: 'W2' } },
  bos: { id: 'bos', name: 'Boston Red Sox', abbreviation: 'BOS', color: '#BD3039', logoUrl: mlbLogoUrl('BOS'), record: { overall: '28-26', winPct: '.519', points: '—', streak: 'L1' } },
  lad: { id: 'lad', name: 'Los Angeles Dodgers', abbreviation: 'LAD', color: '#005A9C', logoUrl: mlbLogoUrl('LAD'), record: { overall: '35-19', winPct: '.648', points: '—', streak: 'W4' } },
  sd: { id: 'sd', name: 'San Diego Padres', abbreviation: 'SD', color: '#2F241D', logoUrl: mlbLogoUrl('SD'), record: { overall: '29-25', winPct: '.537', points: '—', streak: 'W1' } },
};

const mlsTeams: Record<string, TeamSummary> = {
  lafc: { id: 'lafc', name: 'LAFC', abbreviation: 'LAFC', color: '#C39E6D', logoUrl: mlsLogoUrl('LAFC'), record: { overall: '8-3-4', winPct: '.667', points: '1.87', streak: 'W2' } },
  la: { id: 'la', name: 'LA Galaxy', abbreviation: 'LA', color: '#00245D', logoUrl: mlsLogoUrl('LA'), record: { overall: '7-4-4', winPct: '.600', points: '1.67', streak: 'D1' } },
  mia: { id: 'mia', name: 'Inter Miami', abbreviation: 'MIA', color: '#F7B5CD', logoUrl: mlsLogoUrl('MIA'), record: { overall: '9-2-3', winPct: '.750', points: '2.00', streak: 'W3' } },
  atl: { id: 'atl', name: 'Atlanta United', abbreviation: 'ATL', color: '#80000A', logoUrl: mlsLogoUrl('ATL'), record: { overall: '6-5-3', winPct: '.500', points: '1.17', streak: 'L1' } },
};

const nhlTeams: Record<string, TeamSummary> = {
  bos: { id: 'bos', name: 'Boston Bruins', abbreviation: 'BOS', color: '#FFB81C', logoUrl: nhlLogoUrl('BOS'), record: { overall: '42-18-5', winPct: '.676', points: '1.37', streak: 'W2' } },
  ny: { id: 'ny', name: 'New York Rangers', abbreviation: 'NYR', color: '#0038A8', logoUrl: nhlLogoUrl('NYR'), record: { overall: '38-22-6', winPct: '.621', points: '1.26', streak: 'W1' } },
  edm: { id: 'edm', name: 'Edmonton Oilers', abbreviation: 'EDM', color: '#FF4C00', logoUrl: nhlLogoUrl('EDM'), record: { overall: '40-20-4', winPct: '.656', points: '1.31', streak: 'L1' } },
  col: { id: 'col', name: 'Colorado Avalanche', abbreviation: 'COL', color: '#6F263D', logoUrl: nhlLogoUrl('COL'), record: { overall: '36-24-5', winPct: '.590', points: '1.20', streak: 'W3' } },
};

const nbaTeams: Record<string, TeamSummary> = {
  bos: { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS', color: '#007A33', logoUrl: nbaLogoUrl('BOS'), record: { overall: '45-20', winPct: '.692', points: '—', streak: 'W2' } },
  ny: { id: 'ny', name: 'New York Knicks', abbreviation: 'NY', color: '#006BB6', logoUrl: nbaLogoUrl('NY'), record: { overall: '40-25', winPct: '.615', points: '—', streak: 'W1' } },
  lal: { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', color: '#552583', logoUrl: nbaLogoUrl('LAL'), record: { overall: '38-27', winPct: '.585', points: '—', streak: 'L1' } },
  gs: { id: 'gs', name: 'Golden State Warriors', abbreviation: 'GS', color: '#1D428A', logoUrl: nbaLogoUrl('GS'), record: { overall: '36-29', winPct: '.554', points: '—', streak: 'W3' } },
};

const wnbaTeams: Record<string, TeamSummary> = {
  lv: { id: 'lv', name: 'Las Vegas Aces', abbreviation: 'LV', color: '#000000', logoUrl: wnbaLogoUrl('LV'), record: { overall: '8-2', winPct: '.800', points: '—', streak: 'W4' } },
  sea: { id: 'sea', name: 'Seattle Storm', abbreviation: 'SEA', color: '#2C5234', logoUrl: wnbaLogoUrl('SEA'), record: { overall: '6-4', winPct: '.600', points: '—', streak: 'W1' } },
  ny: { id: 'ny', name: 'New York Liberty', abbreviation: 'NY', color: '#86CEBC', logoUrl: wnbaLogoUrl('NY'), record: { overall: '7-3', winPct: '.700', points: '—', streak: 'W2' } },
  conn: { id: 'conn', name: 'Connecticut Sun', abbreviation: 'CONN', color: '#F05023', logoUrl: wnbaLogoUrl('CONN'), record: { overall: '5-5', winPct: '.500', points: '—', streak: 'L2' } },
};

function nflStats(): StatRow[] {
  return [
    { id: '1', label: 'Points/G', awaySeason: 27.4, awaySplit: 26.1, awayLast5: 29.2, awayL5Rank: 4, homeSeason: 24.8, homeSplit: 26.5, homeLast5: 23.0, homeL5Rank: 14, awayAdvantage: true },
    { id: '2', label: 'Opp Pts/G', awaySeason: 19.2, awaySplit: 18.5, awayLast5: 17.8, awayL5Rank: 6, homeSeason: 22.1, homeSplit: 20.4, homeLast5: 24.2, homeL5Rank: 22, awayAdvantage: true },
    { id: '3', label: 'Pass Yds/G', awaySeason: 268.3, awaySplit: 255.0, awayLast5: 281.4, awayL5Rank: 3, homeSeason: 241.2, homeSplit: 252.8, homeLast5: 235.6, homeL5Rank: 18, awayAdvantage: true },
    { id: '4', label: 'Rush Yds/G', awaySeason: 118.5, awaySplit: 112.2, awayLast5: 125.0, awayL5Rank: 8, homeSeason: 105.3, homeSplit: 110.8, homeLast5: 98.4, homeL5Rank: 12, awayAdvantage: true },
    { id: '5', label: 'Total Yds/G', awaySeason: 386.8, awaySplit: 367.2, awayLast5: 406.4, awayL5Rank: 5, homeSeason: 346.5, homeSplit: 363.6, homeLast5: 334.0, homeL5Rank: 16, awayAdvantage: true },
    { id: '6', label: 'Opp Rush/G', awaySeason: 98.2, awaySplit: 95.0, awayLast5: 92.4, awayL5Rank: 7, homeSeason: 112.5, homeSplit: 108.2, homeLast5: 118.0, homeL5Rank: 24, awayAdvantage: true },
    { id: '7', label: '3rd Down %', awaySeason: 0.452, awaySplit: 0.438, awayLast5: 0.468, awayL5Rank: 9, homeSeason: 0.421, homeSplit: 0.435, homeLast5: 0.410, homeL5Rank: 20, awayAdvantage: true, format: 'percent' },
    { id: '8', label: 'Red Zone %', awaySeason: 0.612, awaySplit: 0.598, awayLast5: 0.635, awayL5Rank: 2, homeSeason: 0.558, homeSplit: 0.572, homeLast5: 0.540, homeL5Rank: 15, awayAdvantage: true, format: 'percent' },
    { id: '9', label: 'Turnovers/G', awaySeason: 0.9, awaySplit: 1.0, awayLast5: 0.6, awayL5Rank: 5, homeSeason: 1.2, homeSplit: 1.1, homeLast5: 1.4, homeL5Rank: 26, awayAdvantage: true },
    { id: '10', label: 'Sacks/G', awaySeason: 2.8, awaySplit: 2.5, awayLast5: 3.2, awayL5Rank: 11, homeSeason: 3.1, homeSplit: 3.4, homeLast5: 3.0, homeL5Rank: 8, awayAdvantage: false },
    { id: '11', label: 'Penalties/G', awaySeason: 6.2, awaySplit: 6.5, awayLast5: 5.8, awayL5Rank: 14, homeSeason: 7.1, homeSplit: 6.8, homeLast5: 7.4, homeL5Rank: 22, awayAdvantage: true },
    { id: '12', label: 'TOP (min)', awaySeason: 31.2, awaySplit: 30.5, awayLast5: 32.0, awayL5Rank: 6, homeSeason: 29.8, homeSplit: 30.2, homeLast5: 29.2, homeL5Rank: 18, awayAdvantage: true },
  ];
}

function mlbStats(): StatRow[] {
  return [
    { id: '1', label: 'Runs/G', awaySeason: 5.2, awaySplit: 4.9, awayLast5: 5.8, awayL5Rank: 5, homeSeason: 4.6, homeSplit: 4.8, homeLast5: 4.2, homeL5Rank: 18, awayAdvantage: true },
    { id: '2', label: 'Opp Runs/G', awaySeason: 3.8, awaySplit: 3.6, awayLast5: 3.4, awayL5Rank: 8, homeSeason: 4.5, homeSplit: 4.2, homeLast5: 5.0, homeL5Rank: 24, awayAdvantage: true },
    { id: '3', label: 'Hits/G', awaySeason: 8.9, awaySplit: 8.5, awayLast5: 9.4, awayL5Rank: 6, homeSeason: 8.2, homeSplit: 8.4, homeLast5: 7.8, homeL5Rank: 14, awayAdvantage: true },
    { id: '4', label: 'HR/G', awaySeason: 1.4, awaySplit: 1.2, awayLast5: 1.6, awayL5Rank: 4, homeSeason: 1.1, homeSplit: 1.3, homeLast5: 1.0, homeL5Rank: 12, awayAdvantage: true },
    { id: '5', label: 'BA', awaySeason: 0.262, awaySplit: 0.255, awayLast5: 0.271, awayL5Rank: 7, homeSeason: 0.248, homeSplit: 0.252, homeLast5: 0.242, homeL5Rank: 20, awayAdvantage: true, format: 'decimal' },
    { id: '6', label: 'ERA', awaySeason: 3.42, awaySplit: 3.55, awayLast5: 3.18, awayL5Rank: 9, homeSeason: 4.12, homeSplit: 3.98, homeLast5: 4.35, homeL5Rank: 22, awayAdvantage: true },
    { id: '7', label: 'WHIP', awaySeason: 1.18, awaySplit: 1.22, awayLast5: 1.14, awayL5Rank: 10, homeSeason: 1.32, homeSplit: 1.28, homeLast5: 1.38, homeL5Rank: 25, awayAdvantage: true, format: 'decimal' },
    { id: '8', label: 'K/9', awaySeason: 9.4, awaySplit: 9.1, awayLast5: 9.8, awayL5Rank: 11, homeSeason: 8.6, homeSplit: 8.9, homeLast5: 8.2, homeL5Rank: 16, awayAdvantage: true },
    { id: '9', label: 'SB/G', awaySeason: 0.8, awaySplit: 0.7, awayLast5: 1.0, awayL5Rank: 13, homeSeason: 0.6, homeSplit: 0.8, homeLast5: 0.5, homeL5Rank: 18, awayAdvantage: true },
    { id: '10', label: 'Errors/G', awaySeason: 0.5, awaySplit: 0.6, awayLast5: 0.4, awayL5Rank: 6, homeSeason: 0.7, homeSplit: 0.6, homeLast5: 0.8, homeL5Rank: 21, awayAdvantage: true },
  ];
}

function mlsStats(): StatRow[] {
  return [
    { id: '1', label: 'Goals/G', awaySeason: 1.8, awaySplit: 1.6, awayLast5: 2.0, awayL5Rank: 4, homeSeason: 1.5, homeSplit: 1.7, homeLast5: 1.4, homeL5Rank: 14, awayAdvantage: true },
    { id: '2', label: 'Opp Goals/G', awaySeason: 1.1, awaySplit: 1.2, awayLast5: 0.8, awayL5Rank: 5, homeSeason: 1.4, homeSplit: 1.3, homeLast5: 1.6, homeL5Rank: 20, awayAdvantage: true },
    { id: '3', label: 'Shots/G', awaySeason: 14.2, awaySplit: 13.5, awayLast5: 15.4, awayL5Rank: 6, homeSeason: 12.8, homeSplit: 13.2, homeLast5: 12.0, homeL5Rank: 16, awayAdvantage: true },
    { id: '4', label: 'Shots on Tgt/G', awaySeason: 5.4, awaySplit: 5.1, awayLast5: 5.8, awayL5Rank: 7, homeSeason: 4.8, homeSplit: 5.0, homeLast5: 4.6, homeL5Rank: 15, awayAdvantage: true },
    { id: '5', label: 'Possession %', awaySeason: 0.542, awaySplit: 0.528, awayLast5: 0.558, awayL5Rank: 3, homeSeason: 0.498, homeSplit: 0.512, homeLast5: 0.485, homeL5Rank: 18, awayAdvantage: true, format: 'percent' },
    { id: '6', label: 'Pass Acc %', awaySeason: 0.842, awaySplit: 0.835, awayLast5: 0.851, awayL5Rank: 8, homeSeason: 0.818, homeSplit: 0.825, homeLast5: 0.810, homeL5Rank: 19, awayAdvantage: true, format: 'percent' },
    { id: '7', label: 'Corners/G', awaySeason: 5.8, awaySplit: 5.4, awayLast5: 6.2, awayL5Rank: 9, homeSeason: 5.2, homeSplit: 5.6, homeLast5: 4.8, homeL5Rank: 14, awayAdvantage: true },
    { id: '8', label: 'Fouls/G', awaySeason: 11.2, awaySplit: 11.5, awayLast5: 10.8, awayL5Rank: 12, homeSeason: 12.4, homeSplit: 12.0, homeLast5: 12.8, homeL5Rank: 22, awayAdvantage: true },
    { id: '9', label: 'Yellow Cards/G', awaySeason: 1.8, awaySplit: 1.9, awayLast5: 1.6, awayL5Rank: 10, homeSeason: 2.1, homeSplit: 2.0, homeLast5: 2.2, homeL5Rank: 20, awayAdvantage: true },
    { id: '10', label: 'Clean Sheets %', awaySeason: 0.35, awaySplit: 0.32, awayLast5: 0.40, awayL5Rank: 6, homeSeason: 0.28, homeSplit: 0.30, homeLast5: 0.25, homeL5Rank: 16, awayAdvantage: true, format: 'percent' },
  ];
}

function nbaStats(): StatRow[] {
  return wnbaStats();
}

function nhlStats(): StatRow[] {
  return [
    { id: '1', label: 'Goals/G', awaySeason: 3.2, awaySplit: 3.0, awayLast5: 3.4, awayL5Rank: 5, homeSeason: 2.9, homeSplit: 3.1, homeLast5: 2.6, homeL5Rank: 12, awayAdvantage: true },
    { id: '2', label: 'Opp Goals/G', awaySeason: 2.8, awaySplit: 3.0, awayLast5: 2.4, awayL5Rank: 8, homeSeason: 3.1, homeSplit: 2.9, homeLast5: 3.4, homeL5Rank: 18, awayAdvantage: true },
    { id: '3', label: 'Blocks/G', awaySeason: 14.2, awaySplit: 13.8, awayLast5: 15.0, awayL5Rank: 6, homeSeason: 13.5, homeSplit: 14.1, homeLast5: 12.8, homeL5Rank: 14, awayAdvantage: true },
    { id: '4', label: 'Shots/G', awaySeason: 30.1, awaySplit: 29.4, awayLast5: 31.2, awayL5Rank: 4, homeSeason: 28.6, homeSplit: 29.0, homeLast5: 27.4, homeL5Rank: 16, awayAdvantage: true },
    { id: '6', label: 'Shooting %', awaySeason: 10.6, awaySplit: 10.2, awayLast5: 10.9, awayL5Rank: 7, homeSeason: 10.1, homeSplit: 10.4, homeLast5: 9.8, homeL5Rank: 15, awayAdvantage: true },
    { id: '7', label: 'FW', awaySeason: 28.4, awaySplit: 27.8, awayLast5: 29.2, awayL5Rank: 6, homeSeason: 26.9, homeSplit: 27.4, homeLast5: 25.6, homeL5Rank: 14, awayAdvantage: true },
    { id: '8', label: 'FO %', awaySeason: 51.2, awaySplit: 50.8, awayLast5: 51.8, awayL5Rank: 8, homeSeason: 49.8, homeSplit: 50.2, homeLast5: 49.2, homeL5Rank: 17, awayAdvantage: true },
    { id: '9', label: 'PPG/G', awaySeason: 0.7, awaySplit: 0.8, awayLast5: 0.6, awayL5Rank: 9, homeSeason: 0.6, homeSplit: 0.5, homeLast5: 0.8, homeL5Rank: 11, awayAdvantage: false },
    { id: '10', label: 'PIM/G', awaySeason: 8.4, awaySplit: 8.8, awayLast5: 7.6, awayL5Rank: 14, homeSeason: 9.1, homeSplit: 8.6, homeLast5: 9.4, homeL5Rank: 22, awayAdvantage: true },
  ];
}

function wnbaStats(): StatRow[] {
  return [
    { id: '1', label: 'Points/G', awaySeason: 88.4, awaySplit: 86.2, awayLast5: 91.0, awayL5Rank: 2, homeSeason: 82.6, homeSplit: 84.8, homeLast5: 80.4, homeL5Rank: 8, awayAdvantage: true },
    { id: '2', label: 'Opp Pts/G', awaySeason: 78.2, awaySplit: 79.0, awayLast5: 76.4, awayL5Rank: 4, homeSeason: 84.5, homeSplit: 83.2, homeLast5: 86.0, homeL5Rank: 10, awayAdvantage: true },
    { id: '3', label: 'Rebounds/G', awaySeason: 36.2, awaySplit: 35.0, awayLast5: 37.4, awayL5Rank: 3, homeSeason: 34.1, homeSplit: 35.2, homeLast5: 33.0, homeL5Rank: 7, awayAdvantage: true },
    { id: '4', label: 'Assists/G', awaySeason: 21.4, awaySplit: 20.8, awayLast5: 22.2, awayL5Rank: 5, homeSeason: 19.6, homeSplit: 20.2, homeLast5: 18.8, homeL5Rank: 9, awayAdvantage: true },
    { id: '5', label: 'FG %', awaySeason: 0.468, awaySplit: 0.462, awayLast5: 0.475, awayL5Rank: 2, homeSeason: 0.442, homeSplit: 0.448, homeLast5: 0.438, homeL5Rank: 8, awayAdvantage: true, format: 'percent' },
    { id: '6', label: '3PT %', awaySeason: 0.362, awaySplit: 0.355, awayLast5: 0.378, awayL5Rank: 3, homeSeason: 0.338, homeSplit: 0.342, homeLast5: 0.330, homeL5Rank: 9, awayAdvantage: true, format: 'percent' },
    { id: '7', label: 'FT %', awaySeason: 0.812, awaySplit: 0.805, awayLast5: 0.820, awayL5Rank: 4, homeSeason: 0.788, homeSplit: 0.792, homeLast5: 0.780, homeL5Rank: 7, awayAdvantage: true, format: 'percent' },
    { id: '8', label: 'Turnovers/G', awaySeason: 12.4, awaySplit: 12.8, awayLast5: 11.8, awayL5Rank: 5, homeSeason: 14.2, homeSplit: 13.6, homeLast5: 14.8, homeL5Rank: 10, awayAdvantage: true },
    { id: '9', label: 'Steals/G', awaySeason: 8.2, awaySplit: 7.8, awayLast5: 8.6, awayL5Rank: 3, homeSeason: 7.4, homeSplit: 7.6, homeLast5: 7.0, homeL5Rank: 8, awayAdvantage: true },
    { id: '10', label: 'Blocks/G', awaySeason: 4.6, awaySplit: 4.4, awayLast5: 4.8, awayL5Rank: 4, homeSeason: 4.0, homeSplit: 4.2, homeLast5: 3.8, homeL5Rank: 9, awayAdvantage: true },
  ];
}

export const matches: Match[] = [
  {
    id: 'nfl-1',
    sport: 'NFL',
    awayTeam: nflTeams.kc,
    homeTeam: nflTeams.buf,
    startTime: '4:25 PM ET',
    location: 'Buffalo, NY',
    weekLabel: 'Week 10',
    gameDate: gameDateFromToday(0),
    stats: nflStats(),
  },
  {
    id: 'nfl-2',
    sport: 'NFL',
    awayTeam: nflTeams.dal,
    homeTeam: nflTeams.phi,
    startTime: '8:20 PM ET',
    location: 'Philadelphia, PA',
    weekLabel: 'Week 10',
    gameDate: gameDateFromToday(1),
    stats: nflStats(),
  },
  {
    id: 'nfl-3',
    sport: 'NFL',
    awayTeam: nflTeams.sf,
    homeTeam: nflTeams.sea,
    startTime: '4:05 PM ET',
    location: 'Seattle, WA',
    weekLabel: 'Week 10',
    gameDate: gameDateFromToday(6),
    stats: nflStats(),
  },
  {
    id: 'mlb-1',
    sport: 'MLB',
    awayTeam: mlbTeams.nyy,
    homeTeam: mlbTeams.bos,
    startTime: '7:10 PM ET',
    location: 'Boston, MA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(0),
    stats: mlbStats(),
  },
  {
    id: 'mlb-2',
    sport: 'MLB',
    awayTeam: mlbTeams.lad,
    homeTeam: mlbTeams.sd,
    startTime: '9:40 PM ET',
    location: 'San Diego, CA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(0),
    stats: mlbStats(),
  },
  {
    id: 'mlb-3',
    sport: 'MLB',
    awayTeam: mlbTeams.bos,
    homeTeam: mlbTeams.nyy,
    startTime: '7:05 PM ET',
    location: 'Bronx, NY',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(1),
    stats: mlbStats(),
  },
  {
    id: 'mlb-4',
    sport: 'MLB',
    awayTeam: mlbTeams.sd,
    homeTeam: mlbTeams.lad,
    startTime: '10:10 PM ET',
    location: 'Los Angeles, CA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(2),
    stats: mlbStats(),
  },
  {
    id: 'mlb-5',
    sport: 'MLB',
    awayTeam: mlbTeams.nyy,
    homeTeam: mlbTeams.bos,
    startTime: '1:10 PM ET',
    location: 'Boston, MA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(3),
    stats: mlbStats(),
  },
  {
    id: 'mlb-6',
    sport: 'MLB',
    awayTeam: mlbTeams.lad,
    homeTeam: mlbTeams.nyy,
    startTime: '7:10 PM ET',
    location: 'Bronx, NY',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(5),
    stats: mlbStats(),
  },
  {
    id: 'nhl-1',
    sport: 'NHL',
    awayTeam: nhlTeams.bos,
    homeTeam: nhlTeams.ny,
    startTime: '7:00 PM ET',
    location: 'New York, NY',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(0),
    stats: nhlStats(),
  },
  {
    id: 'nhl-2',
    sport: 'NHL',
    awayTeam: nhlTeams.edm,
    homeTeam: nhlTeams.col,
    startTime: '9:00 PM ET',
    location: 'Denver, CO',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(2),
    stats: nhlStats(),
  },
  {
    id: 'mls-1',
    sport: 'MLS',
    awayTeam: mlsTeams.lafc,
    homeTeam: mlsTeams.la,
    startTime: '10:30 PM ET',
    location: 'Carson, CA',
    weekLabel: 'Matchweek 15',
    gameDate: gameDateFromToday(0),
    stats: mlsStats(),
  },
  {
    id: 'mls-2',
    sport: 'MLS',
    awayTeam: mlsTeams.mia,
    homeTeam: mlsTeams.atl,
    startTime: '7:30 PM ET',
    location: 'Atlanta, GA',
    weekLabel: 'Matchweek 15',
    gameDate: gameDateFromToday(2),
    stats: mlsStats(),
  },
  {
    id: 'nba-1',
    sport: 'NBA',
    awayTeam: nbaTeams.bos,
    homeTeam: nbaTeams.ny,
    startTime: '7:30 PM ET',
    location: 'New York, NY',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(0),
    stats: nbaStats(),
  },
  {
    id: 'nba-2',
    sport: 'NBA',
    awayTeam: nbaTeams.lal,
    homeTeam: nbaTeams.gs,
    startTime: '10:00 PM ET',
    location: 'San Francisco, CA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(1),
    stats: nbaStats(),
  },
  {
    id: 'wnba-1',
    sport: 'WNBA',
    awayTeam: wnbaTeams.lv,
    homeTeam: wnbaTeams.sea,
    startTime: '10:00 PM ET',
    location: 'Seattle, WA',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(0),
    stats: wnbaStats(),
  },
  {
    id: 'wnba-2',
    sport: 'WNBA',
    awayTeam: wnbaTeams.ny,
    homeTeam: wnbaTeams.conn,
    startTime: '7:00 PM ET',
    location: 'Uncasville, CT',
    weekLabel: 'This Week',
    gameDate: gameDateFromToday(1),
    stats: wnbaStats(),
  },
];

export function getMatchesForSport(sport: Sport): Match[] {
  return matches.filter((m) => m.sport === sport);
}

export function getMatchById(id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

export function getWeekLabel(sport: Sport): string {
  const first = getMatchesForSport(sport)[0];
  return first?.weekLabel ?? 'This Week';
}
