import { useCallback, useEffect, useState } from 'react';
import { fetchMatchesForSport, fetchWeekLabel } from '../data/matchesApi';
import type { Match, Sport } from '../types';

type State = {
  matches: Match[];
  weekLabel: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMatchesForSport(sport: Sport): State {
  const [matches, setMatches] = useState<Match[]>([]);
  const [weekLabel, setWeekLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [matchList, week] = await Promise.all([
          fetchMatchesForSport(sport),
          fetchWeekLabel(sport),
        ]);
        if (!cancelled) {
          setMatches(matchList);
          setWeekLabel(week);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load matches');
          setMatches([]);
          setWeekLabel('');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sport, tick]);

  return { matches, weekLabel, loading, error, refetch };
}
