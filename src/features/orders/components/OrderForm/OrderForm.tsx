import { useState, type FC, type FormEvent } from 'react';
import type { CoinSummary } from '@/features/orders/types';
import { CoinSearch } from '@/shared/components/CoinSearch';
import { useOrdersStore } from '@/features/orders/store';
import { randomId } from '@/shared/utils';

interface Props {
  coins: CoinSummary[];
}

export const OrderForm: FC<Props> = ({ coins }) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinSummary | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const addOrder = useOrdersStore((s) => s.addOrder);

  const handleTargetPriceChange = (value: string) => {
    setTargetPrice(value);
    setWarning(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCoin) return;

    const target = parseFloat(targetPrice);
    const qty = parseFloat(quantity);

    if (isNaN(target) || target <= 0) return;
    if (isNaN(qty) || qty <= 0) return;

    // Warn if target is already below current price — order will never execute
    // unless price drops further. We allow it but show the warning.
    if (target >= selectedCoin.priceUsd && !warning) {
      setWarning(
        `Target $${target.toLocaleString()} is at or above the current price ` +
          `$${selectedCoin.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}. ` +
          `This is a buy order — it executes when price DROPS to your target. ` +
          `Submit again to confirm.`,
      );
      return;
    }

    addOrder({
      id: randomId(),
      coinId: selectedCoin.id,
      coinName: selectedCoin.name,
      coinSymbol: selectedCoin.symbol,
      targetPrice: target,
      quantity: qty,
      placedAt: new Date().toISOString(),
    });

    setSelectedCoin(null);
    setTargetPrice('');
    setQuantity('');
    setWarning(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Coin</label>
        <CoinSearch
          coins={coins}
          selected={selectedCoin}
          onSelect={(c) => {
            setSelectedCoin(c);
            setWarning(null);
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Target Price (USD)</label>
        <input
          type="number"
          step="any"
          min="0"
          required
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
          placeholder="0.00"
          value={targetPrice}
          onChange={(e) => handleTargetPriceChange(e.target.value)}
        />
        {selectedCoin && (
          <p className="mt-1 text-xs text-gray-400">
            Current: $
            {selectedCoin.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Quantity</label>
        <input
          type="number"
          step="any"
          min="0"
          required
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {warning && (
        <div className="rounded border border-yellow-500 bg-yellow-900/40 px-3 py-2 text-sm text-yellow-300">
          {warning}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedCoin}
        className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {warning ? 'Confirm Order' : 'Place Buy Order'}
      </button>

      {submitted && (
        <p className="text-center text-sm text-green-400">Order placed successfully!</p>
      )}
    </form>
  );
};
