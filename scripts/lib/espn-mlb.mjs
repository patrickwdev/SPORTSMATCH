import { createEspnScheduleApi } from './espn-schedule.mjs';

const mlbApi = createEspnScheduleApi({
  sport: 'MLB',
  idPrefix: 'espn',
  scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
});

export const fetchScoreboardForDate = mlbApi.fetchScoreboardForDate;
export const fetchMlbScheduleWindow = mlbApi.fetchScheduleWindow;
export const hasActiveGames = mlbApi.hasActiveGames;
