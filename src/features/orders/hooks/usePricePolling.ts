import { useEffect, useRef } from 'react';
import { useOrdersStore } from '@/features/orders/store';
import { fetchCoinPrice } from '@/features/orders/api';
import { detectCrossedOrders, buildExecutedOrders } from '@/features/orders/utils';

const POLL_INTERVAL_MS = 30_000;

/**
 * Drives the limit-order simulator's price polling loop.
 *
 * Behaviour:
 * - Derives the set of coins to watch directly from `pendingOrders` — no
 *   manual add/remove; coins fall off the polling set automatically when
 *   all their orders execute.
 * - Polls every 30 s via setInterval.
 * - Pauses when the tab is hidden (visibilityState === 'hidden').
 * - On tab becoming visible: fires one immediate poll, then restarts the
 *   interval — never waits a full 30 s after coming back.
 * - `previousPrices` lives in a ref (not React state) so writes don't cause
 *   re-renders and there are no stale-closure issues.
 */
export function usePricePolling() {
  const pendingOrders = useOrdersStore((s) => s.pendingOrders);

  // Stable refs — always point to the latest values without re-registering effects
  const pendingOrdersRef = useRef(pendingOrders);
  pendingOrdersRef.current = pendingOrders;

  const previousPricesRef = useRef<Record<string, number>>({});

  // Derived, serialised key — effect only re-runs when the watched coin set changes
  const coinsKey = [...new Set(pendingOrders.map((o) => o.coinId))].sort().join(',');

  useEffect(() => {
    const coinsToWatch = coinsKey ? coinsKey.split(',') : [];
    if (coinsToWatch.length === 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const { executeOrders, setPreviousPrice, setPollError } = useOrdersStore.getState();

    async function pollCoin(coinId: string) {
      try {
        const currentPrice = await fetchCoinPrice(coinId);
        const prevPrice = previousPricesRef.current[coinId];

        setPollError(coinId, null);

        if (prevPrice !== undefined) {
          const orders = pendingOrdersRef.current.filter((o) => o.coinId === coinId);
          const crossed = detectCrossedOrders(orders, prevPrice, currentPrice);
          if (crossed.length > 0) {
            const executed = buildExecutedOrders(crossed, currentPrice, new Date().toISOString());
            executeOrders(executed);
          }
        }

        previousPricesRef.current[coinId] = currentPrice;
        setPreviousPrice(coinId, currentPrice);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setPollError(coinId, err instanceof Error ? err.message : 'Poll failed');
        // Non-crashing — polling continues on the next cycle
      }
    }

    function pollAll() {
      // Parallel — all coins polled in one cycle
      void Promise.allSettled(coinsToWatch.map(pollCoin));
    }

    function start() {
      pollAll(); // immediate poll on start / resume
      intervalId = setInterval(pollAll, POLL_INTERVAL_MS);
    }

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        // Resume: immediate poll + restart interval
        start();
      }
    }

    // Start if the tab is currently visible
    if (document.visibilityState !== 'hidden') {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [coinsKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
