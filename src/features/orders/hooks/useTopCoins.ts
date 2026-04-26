import { useState, useEffect } from 'react';
import { fetchTopCoins } from '@/features/orders/api';
import type { CoinSummary } from '@/features/orders/types';

interface UseTopCoinsResult {
  coins: CoinSummary[];
  loading: boolean;
  error: string | null;
}

export const useTopCoins = (): UseTopCoinsResult => {
  const [coins, setCoins] = useState<CoinSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTopCoins()
      .then((data) => {
        if (!cancelled) {
          setCoins(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load coins');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { coins, loading, error };
};
