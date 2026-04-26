import type { CoinSummary, CpCoin, CpTickerResponse } from '@/features/orders/types';

const BASE_URL = 'https://api.coinpaprika.com/v1';

/**
 * Fetch all coins from CoinPaprika (used for ID mapping only).
 * Returns minimal shape: id, symbol, name.
 */
export async function fetchCpAllCoins(): Promise<CpCoin[]> {
  const res = await fetch(`${BASE_URL}/coins`);
  if (!res.ok) throw new Error(`CoinPaprika /coins failed: ${res.status}`);
  const data = (await res.json()) as Array<{ id: string; symbol: string; name: string }>;
  return data.map(({ id, symbol, name }) => ({ id, symbol, name }));
}

/**
 * Fetch top 200 coins by market cap with live prices.
 * Used to populate the order-form dropdown.
 */
export async function fetchTopCoins(): Promise<CoinSummary[]> {
  const res = await fetch(`${BASE_URL}/tickers?limit=200`);
  if (!res.ok) throw new Error(`CoinPaprika /tickers failed: ${res.status}`);
  const data = (await res.json()) as CpTickerResponse[];
  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    priceUsd: coin.quotes.USD.price,
  }));
}

/**
 * Fetch the live price for a single coin by its CoinPaprika ID.
 * Used during the polling cycle.
 */
export async function fetchCoinPrice(coinId: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(`${BASE_URL}/tickers/${coinId}`, { signal });
  if (!res.ok) throw new Error(`CoinPaprika /tickers/${coinId} failed: ${res.status}`);
  const data = (await res.json()) as CpTickerResponse;
  return data.quotes.USD.price;
}
