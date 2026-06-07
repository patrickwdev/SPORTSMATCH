import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMatchesForSport, fetchWeekLabel } from '../data/matchesApi';
import type { Match, Sport } from '../types';

type State = {
  matches: Match[];
  weekLabel: string;
  /** True only on first load for a sport (empty list). */
  loading: boolean;
  /** True during background score/schedule refresh — keeps the list visible. */
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMatchesForSport(sport: Sport): State {
  const [matches, setMatches] = useState<Match[]>([]);
  const [weekLabel, setWeekLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const loadedSportRef = useRef<Sport | null>(null);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = loadedSportRef.current !== sport;
    if (isInitialLoad) {
      setMatches([]);
      setLoading(true);
      setRefreshing(false);
    } else {
      setRefreshing(true);
    }
    setError(null);

    async function load() {
      try {
        const [matchList, week] = await Promise.all([
          fetchMatchesForSport(sport),
          fetchWeekLabel(sport),
        ]);
        if (!cancelled) {
          setMatches(matchList);
          setWeekLabel(week);
          loadedSportRef.current = sport;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load matches');
          if (isInitialLoad) {
            setMatches([]);
            setWeekLabel('');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sport, tick]);

  return { matches, weekLabel, loading, refreshing, error, refetch };
}
