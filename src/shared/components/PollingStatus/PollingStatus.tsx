import { type FC } from 'react';
import { useOrdersStore } from '@/features/orders/store';

export const PollingStatus: FC = () => {
  const pollErrors = useOrdersStore((s) => s.pollErrors);
  const errorEntries = Object.entries(pollErrors);

  if (errorEntries.length === 0) return null;

  return (
    <div className="rounded border border-red-500 bg-red-900/30 px-3 py-2 text-sm text-red-300">
      <p className="mb-1 font-semibold">Poll errors (polling will retry automatically):</p>
      <ul className="space-y-0.5">
        {errorEntries.map(([coinId, message]) => (
          <li key={coinId}>
            <span className="font-mono text-red-200">{coinId}</span>: {message}
          </li>
        ))}
      </ul>
    </div>
  );
};
