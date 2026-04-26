import { useState, useRef, type FC } from 'react';
import type { CoinSummary } from '@/features/orders/types';
import { useOutsideClick } from '@/shared/hooks';
import { MAX_SEARCH_COINS_COUNT } from './constants';

interface Props {
  coins: CoinSummary[];
  selected: CoinSummary | null;
  onSelect: (coin: CoinSummary) => void;
  disabled?: boolean;
}

export const CoinSearch: FC<Props> = ({ coins, selected, onSelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(query.toLowerCase()),
      )
    : coins;

  useOutsideClick(containerRef, () => setOpen(false));

  const handleSelect = (coin: CoinSummary) => {
    onSelect(coin);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        placeholder="Search coin…"
        value={open ? query : selected ? `${selected.name} (${selected.symbol})` : ''}
        disabled={disabled}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        onChange={(e) => setQuery(e.target.value)}
      />

      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-600 bg-gray-800 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No coins found</li>
          ) : (
            filtered.slice(0, MAX_SEARCH_COINS_COUNT).map((coin) => (
              <li
                key={coin.id}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-700"
                onMouseDown={() => handleSelect(coin)}
              >
                <span className="font-medium text-white">
                  {coin.name} <span className="text-gray-400">({coin.symbol})</span>
                </span>
                <span className="text-gray-300">
                  ${coin.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
