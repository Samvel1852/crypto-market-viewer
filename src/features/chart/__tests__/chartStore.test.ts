import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChartStore } from '@/features/chart/store';

vi.mock('@/features/chart/api/coingecko', () => ({
  fetchMarketChart: vi.fn(),
}));

import { fetchMarketChart } from '@/features/chart/api/coingecko';
import type { ChartPoint } from '@/features/chart/types';

const mockFetchMarketChart = vi.mocked(fetchMarketChart);

const MOCK_DATA: ChartPoint[] = [
  { timestamp: 1_000_000, price: 100 },
  { timestamp: 2_000_000, price: 110 },
];

beforeEach(() => {
  useChartStore.setState({
    cache: new Map(),
    status: 'idle',
    error: null,
    abortController: null,
    selectedCoin: null,
    activeTimeframe: '1D',
  });
  mockFetchMarketChart.mockReset();
});

describe('chartStore — cache behaviour', () => {
  it('fetches data on cache miss', async () => {
    mockFetchMarketChart.mockResolvedValueOnce(MOCK_DATA);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');

    expect(mockFetchMarketChart).toHaveBeenCalledTimes(1);
    expect(mockFetchMarketChart).toHaveBeenCalledWith('bitcoin', '1D', expect.any(AbortSignal));
  });

  it('does NOT fetch on cache hit — same coin+timeframe', async () => {
    mockFetchMarketChart.mockResolvedValueOnce(MOCK_DATA);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');
    expect(mockFetchMarketChart).toHaveBeenCalledTimes(1);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');
    expect(mockFetchMarketChart).toHaveBeenCalledTimes(1);
  });

  it('fetches again for a different timeframe of the same coin', async () => {
    mockFetchMarketChart.mockResolvedValue(MOCK_DATA);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');
    await useChartStore.getState().fetchChartData('bitcoin', '7D');

    expect(mockFetchMarketChart).toHaveBeenCalledTimes(2);
  });

  it('fetches again for a different coin with the same timeframe', async () => {
    mockFetchMarketChart.mockResolvedValue(MOCK_DATA);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');
    await useChartStore.getState().fetchChartData('ethereum', '1D');

    expect(mockFetchMarketChart).toHaveBeenCalledTimes(2);
  });

  it('stores fetched data in the cache', async () => {
    mockFetchMarketChart.mockResolvedValueOnce(MOCK_DATA);

    await useChartStore.getState().fetchChartData('bitcoin', '1D');

    const cached = useChartStore.getState().getCachedData('bitcoin', '1D');
    expect(cached).toEqual(MOCK_DATA);
  });
});

describe('chartStore — AbortController', () => {
  it('aborts the previous request when a new one starts', async () => {
    let firstSignal: AbortSignal | undefined;

    mockFetchMarketChart.mockImplementationOnce((_id, _tf, signal) => {
      firstSignal = signal;
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA), 100));
    });
    mockFetchMarketChart.mockResolvedValueOnce(MOCK_DATA);

    const firstFetch = useChartStore.getState().fetchChartData('bitcoin', '1D');
    const secondFetch = useChartStore.getState().fetchChartData('bitcoin', '7D');

    await Promise.allSettled([firstFetch, secondFetch]);

    expect(firstSignal?.aborted).toBe(true);
  });

  it('sets status to error on failed fetch', async () => {
    mockFetchMarketChart.mockRejectedValueOnce(new Error('Network error'));

    await useChartStore.getState().fetchChartData('bitcoin', '1D');

    expect(useChartStore.getState().status).toBe('error');
    expect(useChartStore.getState().error).toContain('Network error');
  });

  it('does NOT set error state when request is aborted (AbortError)', async () => {
    mockFetchMarketChart.mockImplementationOnce(() => {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    await useChartStore.getState().fetchChartData('bitcoin', '1D');

    expect(useChartStore.getState().status).toBe('loading');
    expect(useChartStore.getState().error).toBeNull();
  });
});
