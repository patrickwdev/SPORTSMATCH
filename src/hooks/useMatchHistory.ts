import { useEffect, useState } from 'react';
import { loadMatchHistory } from '../lib/espnMatchHistory';
import type { Match, MatchHistory } from '../types';

type State = {
  history: MatchHistory | null;
  loading: boolean;
};

export function useMatchHistory(match: Match | null): State {
  const [history, setHistory] = useState<MatchHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) {
      setHistory(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadMatchHistory(match)
      .then((result) => {
        if (!cancelled) setHistory(result);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [match?.id, match?.awayTeam.id, match?.homeTeam.id, match?.sport]);

  return { history, loading };
}
