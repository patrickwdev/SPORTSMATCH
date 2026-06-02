import { useCallback, useEffect, useState } from 'react';
import { fetchMatchById } from '../data/matchesApi';
import type { Match } from '../types';

type State = {
  match: Match | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMatch(matchId: string): State {
  const [match, setMatch] = useState<Match | null>(null);
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
        const result = await fetchMatchById(matchId);
        if (!cancelled) {
          setMatch(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load match');
          setMatch(null);
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
  }, [matchId, tick]);

  return { match, loading, error, refetch };
}
