// ─── Orders ──────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  /** CoinPaprika id, or CoinGecko id if using optional Geck live mode */
  coinId: string;
  coinName: string;
  coinSymbol: string;
  targetPrice: number;
  quantity: number;
  placedAt: string; // ISO timestamp
}

export interface ExecutedOrder extends Order {
  executionPrice: number;
  executedAt: string; // ISO timestamp
}

// ─── Coins ───────────────────────────────────────────────────────────────────

export interface CoinSummary {
  /** CoinPaprika id (e.g. `btc-bitcoin`) or CoinGecko id (e.g. `bitcoin`) when using Geck live mode */
  id: string;
  symbol: string;
  name: string;
  /** Current price in USD */
  priceUsd: number;
}

// ─── CoinPaprika API responses ────────────────────────────────────────────────

export interface CpCoin {
  id: string;
  symbol: string;
  name: string;
}

export interface CpTickerResponse {
  id: string;
  name: string;
  symbol: string;
  quotes: {
    USD: {
      price: number;
    };
  };
}
