import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type FC } from 'react';
import { useChartStore } from '@/features/chart/store';
import { useChartData } from '@/features/chart/hooks';
import type { Timeframe } from '@/features/chart/types';

const TIMEFRAMES: Timeframe[] = ['1D', '7D', '1M', '3M', '1Y'];

function formatXAxis(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);
  if (timeframe === '1D') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timeframe === '7D') {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const PriceChart: FC = () => {
  const selectedCoin = useChartStore((s) => s.selectedCoin);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const status = useChartStore((s) => s.status);
  const error = useChartStore((s) => s.error);
  const getCachedData = useChartStore((s) => s.getCachedData);
  const { setTimeframe, closeCoin, fetchChartData } = useChartStore.getState();

  useChartData(selectedCoin?.geckoId, activeTimeframe);

  if (!selectedCoin) return null;

  const chartData = getCachedData(selectedCoin.geckoId, activeTimeframe);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{selectedCoin.name} — Price Chart</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={closeCoin}
            aria-label="Close chart"
          >
            ✕
          </button>
        </div>

        {/* Timeframe switcher */}
        <div className="mb-4 flex gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                activeTimeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div className="h-64">
          {status === 'loading' && (
            <div className="flex h-full items-center justify-center text-gray-400">Loading…</div>
          )}

          {status === 'error' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-red-400">
              <p>{error ?? 'Failed to load chart data'}</p>
              <button
                className="rounded bg-red-700 px-4 py-1.5 text-sm text-white hover:bg-red-600"
                onClick={() => void fetchChartData(selectedCoin.geckoId, activeTimeframe)}
              >
                Retry
              </button>
            </div>
          )}

          {status === 'idle' && chartData && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v: number) => formatXAxis(v, activeTimeframe)}
                  stroke="#6b7280"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  minTickGap={40}
                />
                <YAxis
                  dataKey="price"
                  stroke="#6b7280"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v: number) =>
                    v >= 1
                      ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : `$${v.toFixed(6)}`
                  }
                  width={80}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
                    'Price',
                  ]}
                  labelFormatter={(label: number) => new Date(label).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {status === 'idle' && (!chartData || chartData.length === 0) && (
            <div className="flex h-full items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
