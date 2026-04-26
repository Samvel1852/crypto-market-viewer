// ─── Chart ───────────────────────────────────────────────────────────────────

export type Timeframe = '1D' | '7D' | '1M' | '3M' | '1Y';

export interface ChartPoint {
  timestamp: number;
  price: number;
}

// ─── CoinGecko API responses ──────────────────────────────────────────────────

export interface GeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

export interface GeckoMarketChartResponse {
  prices: [number, number][];
}
