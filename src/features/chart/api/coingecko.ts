import type { GeckoMarketChartResponse, ChartPoint, Timeframe } from '@/features/chart/types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

function getApiKey(): string {
  return (import.meta.env.VITE_COINGECKO_API_KEY as string) ?? '';
}

function buildHeaders(): HeadersInit {
  const key = getApiKey();
  return key ? { 'x-cg-demo-api-key': key } : {};
}

/** Maps our Timeframe enum to the CoinGecko `days` query param. */
const TIMEFRAME_TO_DAYS: Record<Timeframe, string> = {
  '1D': '1',
  '7D': '7',
  '1M': '30',
  '3M': '90',
  '1Y': '365',
};

/**
 * Fetch historical price chart for a CoinGecko coin ID and timeframe.
 * Supports request cancellation via AbortSignal.
 */
export async function fetchMarketChart(
  geckoId: string,
  timeframe: Timeframe,
  signal: AbortSignal,
): Promise<ChartPoint[]> {
  const days = TIMEFRAME_TO_DAYS[timeframe];
  const url = `${BASE_URL}/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, {
    headers: buildHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`CoinGecko /market_chart failed: ${res.status}`);
  const data = (await res.json()) as GeckoMarketChartResponse;
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }));
}
