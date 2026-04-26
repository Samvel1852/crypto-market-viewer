import { useState, type FC } from 'react';
import { useOrdersStore } from '@/features/orders/store';
import { useChartStore } from '@/features/chart/store';
import { useMappingStore } from '@/features/mapping/store';
import { formatPrice, formatDate } from '@/shared/utils';
import { Dialog } from '@/shared/components/Dialog';

export const OrderHistory: FC = () => {
  const history = useOrdersStore((s) => s.history);
  const { selectCoin } = useChartStore.getState();
  const resolveGeckoId = useMappingStore((s) => s.resolveGeckoId);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  if (history.length === 0) {
    return <p className="text-sm text-gray-400">No executed orders yet.</p>;
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
        {[...history].reverse().map((order) => (
          <div
            key={`${order.id}-${order.executedAt}`}
            className="rounded border border-gray-700 bg-gray-800 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <button
                className="font-semibold text-indigo-400 hover:underline"
                onClick={() => handleCoinClick(order.coinId, order.coinName)}
                title="View chart"
              >
                {order.coinName} <span className="text-gray-400">({order.coinSymbol})</span>
              </button>
              <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-xs font-medium text-green-400">
                Executed
              </span>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-x-4 text-gray-300">
              <span>
                Target: <strong className="text-white">${formatPrice(order.targetPrice)}</strong>
              </span>
              <span>
                Qty: <strong className="text-white">{order.quantity}</strong>
              </span>
              <span>
                Exec price:{' '}
                <strong className="text-green-300">${formatPrice(order.executionPrice)}</strong>
              </span>
              <span className="text-gray-500 text-xs self-end">{formatDate(order.executedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
