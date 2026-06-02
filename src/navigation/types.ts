import type { Sport } from '../types';

export type RootStackParamList = {
  Welcome: undefined;
  Matches: { sport: Sport };
  MatchSheet: { matchId: string };
};
