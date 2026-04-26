/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When `true`, MSW intercepts CoinPaprika/CoinGecko fetches in the browser. */
  readonly VITE_MOCK_API?: string;
}
