import { createEspnScheduleApi } from './espn-schedule.mjs';

const nbaApi = createEspnScheduleApi({
  sport: 'NBA',
  idPrefix: 'espn-nba',
  scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
});

export const fetchScoreboardForDate = nbaApi.fetchScoreboardForDate;
export const fetchNbaScheduleWindow = nbaApi.fetchScheduleWindow;
export const hasActiveGames = nbaApi.hasActiveGames;
