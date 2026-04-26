import { useEffect } from 'react';
import { useChartStore } from '@/features/chart/store';
import type { Timeframe } from '@/features/chart/types';

/**
 * Triggers a chart data fetch whenever the geckoId or timeframe changes.
 *
 * Cache hits are handled inside the store action — no network call is made
 * if data for this geckoId+timeframe is already in the session cache.
 *
 * AbortController lifecycle is owned by the store: switching timeframe while
 * a request is in-flight cancels the previous request automatically.
 */
export function useChartData(geckoId: string | undefined, timeframe: Timeframe) {
  const fetchChartData = useChartStore((s) => s.fetchChartData);

  useEffect(() => {
    if (!geckoId) return;
    void fetchChartData(geckoId, timeframe);
  }, [geckoId, timeframe, fetchChartData]);
}
