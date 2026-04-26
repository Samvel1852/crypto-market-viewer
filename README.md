# Crypto Market Viewer

A Limit Order Simulator and Coin Price Chart built with React 19, TypeScript, and Vite.

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Copy the environment variable example and add your CoinGecko Demo API key
cp .env.example .env
# Edit .env and set VITE_COINGECKO_API_KEY=your_demo_key

# Start the development server
npm run dev

# Run the test suite
npm test

# Build for production
npm run build
```

### Environment Variables

| Variable                 | Required | Description                                                                                                                                 |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_COINGECKO_API_KEY` | Yes\*    | CoinGecko Demo API key. Get one free at coingecko.com/en/api/pricing. Not used when `VITE_MOCK_API` mocks are on.                            |
| `VITE_MOCK_API`          | No       | Set to `true` in `.env` to use [MSW](https://mswjs.io) in the browser: intercepts CoinPaprika and CoinGecko fetches with fixture data in [`src/mocks/handlers.ts`](src/mocks/handlers.ts). Handy if APIs return 402, rate limits, or you want to work offline. |

\*Not required for local dev when `VITE_MOCK_API=true`.

CoinPaprika requires no API key. With mocks, network calls never hit the real services.

**Enable mocks:** in `.env` add `VITE_MOCK_API=true` and restart `npm run dev`. **Disable:** remove the line or set `VITE_MOCK_API=false`.

---

## Project Structure

The codebase uses a **feature-based layout** with a **barrel `index.ts` on every folder**. Features are fully self-contained; only `App.tsx` imports across feature boundaries.

```
src/
├── features/
│   ├── orders/                        # Limit Order Simulator
│   │   ├── components/
│   │   │   ├── OrderForm/             # barrel: OrderForm.tsx + index.ts
│   │   │   ├── PendingOrders/
│   │   │   └── OrderHistory/
│   │   ├── store/                     # barrel: ordersStore.ts + index.ts
│   │   ├── hooks/                     # barrel: usePricePolling.ts + index.ts
│   │   ├── api/                       # barrel: coinpaprika.ts + index.ts
│   │   ├── utils/                     # barrel: crossingLogic.ts + index.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   │
│   ├── chart/                         # Coin Price Chart
│   │   ├── components/PriceChart/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── api/                       # coingecko market_chart endpoint
│   │   ├── types.ts
│   │   └── __tests__/
│   │
│   └── mapping/                       # CoinPaprika ↔ CoinGecko ID bridge
│       ├── store/
│       ├── utils/                     # buildCpToGeckoMap
│       ├── api/                       # geckoList (/coins/list)
│       ├── types.ts
│       └── __tests__/
│
├── shared/
│   ├── components/
│   │   ├── CoinSearch/                # CoinSearch.tsx + constants.ts + index.ts
│   │   ├── Dialog/                    # Dialog.tsx + index.ts (closes on outside click)
│   │   └── PollingStatus/
│   ├── hooks/
│   │   ├── useOutsideClick.ts
│   │   └── index.ts
│   └── utils/
│       ├── format.ts                  # formatPrice, formatDate
│       ├── id.ts                      # randomId
│       └── index.ts
│
├── App.tsx
└── main.tsx
```

### Naming conventions

- **`utils/` is the standard React/TS name for pure helper functions;.
- **Barrel pattern** — every folder with exported code gets an `index.ts` that re-exports its public API. Consumers write `from '@/features/orders/store'` instead of `from '@/features/orders/store/ordersStore'`. When an internal file is renamed or split, only its `index.ts` changes — no consumer import breaks.
- **Absolute imports** — all cross-folder imports use the `@/` alias (mapped to `src/`) configured in both `vite.config.ts` and `tsconfig.app.json`. Same-folder relative imports (`./CoinSearch`) remain relative.
- **Component folders** — each component lives in its own subfolder with the same name (`OrderForm/OrderForm.tsx`) and a corresponding `index.ts` barrel. This keeps component-specific files (styles, tests, constants) co-located.

### Import direction rule

```
features/*        →  shared/       ✓
features/mapping  →  features/orders/api   ✓  (one approved exception: mapping
                                               needs CoinPaprika's coin list to
                                               build the ID bridge)
features/*        →  features/*    ✗  (cross-feature otherwise — forbidden)
```

`App.tsx` is the only file that orchestrates across feature boundaries.

---

## Stack Choices

| Tool                  | Version | Reason                                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------------------- |
| React                 | 19      | Current stable, concurrent features, improved ref handling                            |
| TypeScript            | 5.7     | Strict mode throughout; types make the data contracts explicit                        |
| Vite                  | 6       | Fastest dev server, native ESM, Vitest integration                                    |
| Zustand               | 5       | Zero boilerplate, built-in `persist` middleware, no context wrapping, React 19 tested |
| Recharts              | 2.15    | React-native declarative API, composable, good financial chart primitives             |
| Tailwind CSS          | 4       | Utility-first, no CSS files to maintain, Vite plugin (no PostCSS config)              |
| Vitest                | 3       | Native Vite integration, same API as Jest, excellent fake timer support               |
| React Testing Library | 16      | React 19 compatible, encourages behavior-over-implementation testing                  |

**React 19 / Recharts note**: Recharts 2.x requires `react-is` to match your React version. One line in `package.json` handles it:

```json
"overrides": { "react-is": "^19.0.0" }
```

---

## State Management Approach

State is split into three Zustand stores, each with a single responsibility:

### `ordersStore`

Owns all order lifecycle state: `pendingOrders`, `history`, `previousPrices`, and `pollErrors`. Persisted to `localStorage` via Zustand's `persist` middleware, with `previousPrices` and `pollErrors` excluded (they are runtime-only state). This is the single source of truth for everything order-related. Components subscribe to exactly the slice they need — no re-renders from unrelated state changes.

### `mappingStore`

Owns the CoinPaprika → CoinGecko ID lookup table. Initialized once on app mount via `initialize()`. The status field (`idle | loading | ready | error`) lets the UI reflect loading and error states without redundant boolean flags. `resolveGeckoId(cpId)` is the only public API other components need.

### `chartStore`

Owns the selected coin, active timeframe, session cache, and in-flight `AbortController`. The cache is a `Map<string, ChartPoint[]>` keyed by `${geckoId}:${timeframe}`. It lives in the store (not a local ref) so the entire chart lifecycle — cache checks, loading state, error state — is observable from outside the chart component if needed.

---

## Polling Architecture

The polling loop lives in `usePricePolling.ts`. Key decisions:

**Derived polling set**: Rather than manually tracking which coins to poll, the hook derives `coinsToWatch` from `pendingOrders` on every render. The `useEffect` dependency is the sorted, joined string of coin IDs — so the effect only re-fires when the actual set of watched coins changes, not on every order field update. When all orders for a coin execute, it automatically drops out of the next effect cycle.

**Previous prices as a ref**: `previousPricesRef` is a `useRef`, not React state. This is deliberate: updating it must not trigger a re-render, and it must survive re-renders without being reset. It avoids the stale-closure problem entirely because the poll callback reads `previousPricesRef.current` at call time.

**Visibility pause/resume**: A `visibilitychange` listener calls `stop()` on hide and `start()` on show. `start()` fires one immediate `pollAll()` and then sets a new interval — the user never waits a full 30 s after returning to the tab.

**Non-crashing errors**: Each coin is polled independently via `Promise.allSettled`. A network error for one coin is caught, stored in `pollErrors`, and displayed in `PollingStatus`. The interval continues uninterrupted.

**Order crossing logic** is extracted into `src/features/orders/utils/crossingLogic.ts` as a pure function:

```ts
prevPrice > order.targetPrice && currentPrice <= order.targetPrice;
```

This handles both gradual crossings and poll-gap jumps. The `prevPrice > target` guard ensures an order already below target is never re-executed on subsequent polls.

---

## ID Mapping: CoinPaprika → CoinGecko

The two APIs use incompatible ID formats (`btc-bitcoin` vs `bitcoin`). The mapping is built once at startup and cached in memory for the session.

**Algorithm** (`src/features/mapping/utils/buildMapping.ts`):

1. Fetch CoinPaprika `/coins` and CoinGecko `/coins/list` in parallel (`Promise.all`).
2. Index all CoinGecko coins by a composite key: `${symbol.toLowerCase()}:${name.toLowerCase()}`.
3. For each CoinPaprika coin, look up the same composite key. If found, add `cpId → geckoId` to the map.

Using both `symbol` **and** `name` — not just symbol — is intentional. Many coins share the same ticker symbol (dozens of coins use "BTC" as their symbol in different contexts). Requiring both fields to match significantly reduces false positives.

Unmatched coins are excluded from the map. When a user clicks on an unmatched coin to view its chart, a clear message is shown instead of crashing or silently failing.

---

## What I Found Most Difficult

**The order crossing condition** looks simple but has a subtle invariant. `currentPrice <= targetPrice` alone is wrong — it would execute the order on every subsequent poll after the price crosses, because it stays below target. The full condition `prevPrice > targetPrice && currentPrice <= targetPrice` is the correct single-crossing detector. Writing the unit tests for this first (before the hook) made the edge cases concrete: normal crossings, poll-gap jumps, and no-re-execution all needed explicit test coverage.

**AbortController in Zustand**: The `AbortController` instance lives as regular state in the store, which means it serializes to the store snapshot. This required ensuring the abort logic (calling `.abort()` before the new controller is stored) happens synchronously before `set()` is called, not inside a callback. The `closeCoin` action also aborts any in-flight request on chart close.

---

## What I Would Do Differently With More Time

- **Real-time price updates in the order cards**: Show the live price updating inside each pending order row, not just the last-polled value.
- **Optimistic order cancellation with undo**: Cancelling an order could be undoable for a few seconds before the state commits.
- **Virtual scrolling** for the coin search dropdown — currently renders all matched results (up to 200) as DOM nodes; a windowed list would improve performance for large unfiltered sets.
- **E2E tests** (Playwright) covering: place order → price crosses → order appears in history → chart opens → timeframe switch aborts previous request.
- **Service Worker caching** for the `/coins/list` mapping data, so a hard refresh doesn't re-fetch thousands of coin records.
- **Error boundaries per section**: `App.tsx` has no React error boundary today — a render crash blanks the entire app. Wrapping each major panel (`<aside>`, `<PendingOrders>`, `<OrderHistory>`, `<PriceChart>`) in its own error boundary would isolate failures, show a per-section recovery UI, and let the rest of the app continue working.
- **Layout components in `App.tsx`**: The component currently mixes data-orchestration logic (`useMappingStore`, `useTopCoins`, `usePricePolling`) with a large JSX tree. Extracting `<AppLayout>`, `<Sidebar>`, and `<OrdersPanel>` into dedicated layout components would make `App.tsx` a thin orchestrator, keep layout concerns separately testable, and improve readability.
- **Shared API error utility**: Every fetch call currently throws a raw `new Error(...)` string inline with inconsistent message formats across the four API files. A typed `ApiError` class in `shared/utils/` — carrying `status`, `endpoint`, and a normalized `message` — would let callers do `err instanceof ApiError`, distinguish network failures from 4xx/5xx in one place, and make polling error messages uniform.
