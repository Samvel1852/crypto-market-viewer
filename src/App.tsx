import { useEffect } from 'react';
import { useMappingStore } from './features/mapping/store';
import { usePricePolling, useTopCoins } from './features/orders/hooks';
import { OrderForm } from './features/orders/components/OrderForm';
import { PendingOrders } from './features/orders/components/PendingOrders';
import { OrderHistory } from './features/orders/components/OrderHistory';
import { PriceChart } from './features/chart/components/PriceChart';
import { PollingStatus } from './shared/components/PollingStatus';

export default function App() {
  const { initialize, status: mappingStatus, error: mappingError } = useMappingStore();
  const { coins: topCoins, loading: coinsLoading, error: coinsError } = useTopCoins();

  // Initialize the CoinPaprika → CoinGecko ID mapping once on mount
  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Mount the polling hook — it derives which coins to watch from pending orders
  usePricePolling();

  return (
    <div className="min-h-screen bg-gray-950 text-white lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <header className="shrink-0 border-b border-gray-800 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold tracking-tight text-indigo-400">Crypto Market Viewer</h1>
        <p className="mt-0.5 text-xs text-gray-400">Limit Order Simulator + Price Charts</p>
      </header>

      {/* Alerts */}
      <div className="shrink-0 space-y-2 px-4 pt-3 empty:hidden sm:px-4 lg:px-4">
        {mappingStatus === 'error' && (
          <div className="rounded border border-red-500 bg-red-900/30 px-3 py-2 text-sm text-red-300">
            Coin mapping failed: {mappingError}. Charts may be unavailable.
          </div>
        )}
        <PollingStatus />
      </div>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-8 lg:mx-0 lg:min-h-0 lg:max-w-none lg:flex-1 lg:flex-row lg:items-stretch lg:gap-4 lg:pb-4 lg:pl-4 lg:pr-4">
        {/* Order form */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
            <h2 className="mb-4 text-base font-semibold text-white">Place Limit Buy Order</h2>
            {coinsLoading ? (
              <p className="text-sm text-gray-400">Loading coins…</p>
            ) : coinsError ? (
              <p className="text-sm text-red-400">{coinsError}</p>
            ) : (
              <OrderForm coins={topCoins} />
            )}
          </div>
        </aside>

        <div className="flex w-full min-w-0 flex-col gap-6 lg:min-h-0 lg:flex-1 lg:gap-4">
          {/* Pending Orders */}
          <section className="flex flex-col rounded-lg border border-gray-700 bg-gray-900 p-5 lg:min-h-0 lg:flex-1">
            <h2 className="mb-3 shrink-0 text-base font-semibold text-white">
              Pending Orders{' '}
              <span className="ml-1 text-xs font-normal text-gray-400">
                (click a coin name to open its chart)
              </span>
            </h2>
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              <PendingOrders />
            </div>
          </section>

          <section className="flex flex-col rounded-lg border border-gray-700 bg-gray-900 p-5 lg:min-h-0 lg:flex-1">
            <h2 className="mb-3 shrink-0 text-base font-semibold text-white">Order History</h2>
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              <OrderHistory />
            </div>
          </section>
        </div>
      </main>

      {/* Chart modal  */}
      <PriceChart />
    </div>
  );
}
