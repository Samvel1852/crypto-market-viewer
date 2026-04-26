import { http, HttpResponse } from 'msw';
import type { CpCoin, CpTickerResponse } from '@/features/orders/types';
import type { GeckoCoin } from '@/features/mapping/types';

/** Small fixture set: CP + Gecko symbol/name align so `buildCpToGeckoMap` resolves charts. */
const MOCK_CP_LIST: CpCoin[] = [
  { id: 'btc-bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'eth-ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'sol-solana', symbol: 'SOL', name: 'Solana' },
  { id: 'xrp-ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'ada-cardano', symbol: 'ADA', name: 'Cardano' },
];

const MOCK_GECKO_LIST: GeckoCoin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  { id: 'solana', symbol: 'sol', name: 'Solana' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano' },
];

const ticker = (c: CpCoin, priceUsd: number): CpTickerResponse => ({
  id: c.id,
  name: c.name,
  symbol: c.symbol,
  quotes: { USD: { price: priceUsd } },
});

const TOP_TICKERS: CpTickerResponse[] = [
  ...MOCK_CP_LIST.map((c, i) => ticker(c, 90_000 - i * 1_000)),
];

const singleTickerPrice: Record<string, number> = {
  'btc-bitcoin': 90_000,
  'eth-ethereum': 3_200,
  'sol-solana': 140,
  'xrp-ripple': 0.55,
  'ada-cardano': 0.45,
};

function marketChartPrices(): [number, number][] {
  const now = Date.now();
  return [
    [now - 86_400_000, 88_000],
    [now - 43_200_000, 89_500],
    [now, 90_000],
  ];
}

/**
 * Intercepts CoinPaprika + CoinGecko HTTP APIs used by the app.
 * Enable with `VITE_MOCK_API=true` (see .env.example).
 */
export const handlers = [
  http.get('https://api.coinpaprika.com/v1/coins', () => HttpResponse.json(MOCK_CP_LIST)),

  http.get('https://api.coinpaprika.com/v1/tickers', () => HttpResponse.json(TOP_TICKERS)),

  http.get('https://api.coinpaprika.com/v1/tickers/:coinId', ({ params }) => {
    const coinId = params.coinId as string;
    const fromList = TOP_TICKERS.find((t) => t.id === coinId);
    const price = singleTickerPrice[coinId] ?? fromList?.quotes.USD.price ?? 1;
    const t = fromList ?? ticker({ id: coinId, symbol: 'UNK', name: 'Unknown' }, price);
    return HttpResponse.json({ ...t, quotes: { USD: { price } } });
  }),

  http.get('https://api.coingecko.com/api/v3/coins/list', () => HttpResponse.json(MOCK_GECKO_LIST)),

  http.get('https://api.coingecko.com/api/v3/coins/:id/market_chart', () =>
    HttpResponse.json({ prices: marketChartPrices() }),
  ),
];
