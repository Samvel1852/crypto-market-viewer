import type { GeckoCoin } from '@/features/mapping/types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

function getApiKey(): string {
  return (import.meta.env.VITE_COINGECKO_API_KEY as string) ?? '';
}

function buildHeaders(): HeadersInit {
  const key = getApiKey();
  return key ? { 'x-cg-demo-api-key': key } : {};
}

/**
 * Fetch all coins from CoinGecko (used for ID mapping only).
 * Returns minimal shape: id, symbol, name.
 */
export async function fetchGeckoAllCoins(): Promise<GeckoCoin[]> {
  const res = await fetch(`${BASE_URL}/coins/list`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error(`CoinGecko /coins/list failed: ${res.status}`);
  return res.json() as Promise<GeckoCoin[]>;
}
