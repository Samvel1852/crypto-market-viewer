import { useState, type FC } from 'react';
import { useOrdersStore } from '@/features/orders/store';
import { useChartStore } from '@/features/chart/store';
import { useMappingStore } from '@/features/mapping/store';
import { formatPrice, formatDate } from '@/shared/utils';
import { Dialog } from '@/shared/components/Dialog';

export const PendingOrders: FC = () => {
  const pendingOrders = useOrdersStore((s) => s.pendingOrders);
  const previousPrices = useOrdersStore((s) => s.previousPrices);
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);
  const { selectCoin } = useChartStore.getState();
  const resolveGeckoId = useMappingStore((s) => s.resolveGeckoId);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  if (pendingOrders.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No pending orders. Place a buy order above to get started.
      </p>
    );
  }

  const handleCoinClick = (coinId: string, coinName: string) => {
    const geckoId = resolveGeckoId(coinId);
    if (!geckoId) {
      setDialogMessage(`No CoinGecko mapping found for "${coinName}". Chart unavailable.`);
      return;
    }
    selectCoin({ cpId: coinId, geckoId, name: coinName });
  };

  return (
    <>
      {dialogMessage && <Dialog message={dialogMessage} onClose={() => setDialogMessage(null)} />}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {pendingOrders.map((order) => {
          const currentPrice = previousPrices[order.coinId];
          return (
            <div key={order.id} className="rounded border border-gray-700 bg-gray-800 p-3 text-sm">
              <div className="flex items-center justify-between">
                <button
                  className="font-semibold text-indigo-400 hover:underline"
                  onClick={() => handleCoinClick(order.coinId, order.coinName)}
                  title="View chart"
                >
                  {order.coinName} <span className="text-gray-400">({order.coinSymbol})</span>
                </button>
                <button
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => cancelOrder(order.id)}
                >
                  Cancel
                </button>
              </div>

              <div className="mt-1 grid grid-cols-2 gap-x-4 text-gray-300">
                <span>
                  Target: <strong className="text-white">${formatPrice(order.targetPrice)}</strong>
                </span>
                <span>
                  Qty: <strong className="text-white">{order.quantity}</strong>
                </span>
                {currentPrice !== undefined && (
                  <span className="col-span-2 text-gray-400">
                    Last price: ${formatPrice(currentPrice)}
                  </span>
                )}
                <span className="col-span-2 text-gray-500 text-xs">
                  Placed {formatDate(order.placedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
