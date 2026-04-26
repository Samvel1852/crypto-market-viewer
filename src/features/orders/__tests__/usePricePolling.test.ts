import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrdersStore } from '@/features/orders/store';
import { usePricePolling } from '@/features/orders/hooks';
import type { Order } from '@/features/orders/types';

vi.mock('@/features/orders/api/coinpaprika', () => ({
  fetchCoinPrice: vi.fn(),
}));

import { fetchCoinPrice } from '@/features/orders/api/coinpaprika';

const mockFetchCoinPrice = vi.mocked(fetchCoinPrice);

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    coinId: 'btc-bitcoin',
    coinName: 'Bitcoin',
    coinSymbol: 'BTC',
    targetPrice: 90_000,
    quantity: 1,
    placedAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedStore(orders: Order[]) {
  useOrdersStore.setState({
    pendingOrders: orders,
    history: [],
    previousPrices: {},
    pollErrors: {},
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockFetchCoinPrice.mockReset();
  useOrdersStore.setState({ pendingOrders: [], history: [], previousPrices: {}, pollErrors: {} });
  Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePricePolling — interval behaviour', () => {
  it('fires an immediate poll on mount when orders are present', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);
    expect(mockFetchCoinPrice).toHaveBeenCalledWith('btc-bitcoin');
  });

  it('does NOT poll when there are no pending orders', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([]);

    renderHook(() => usePricePolling());

    await act(async () => {
      vi.advanceTimersByTime(31_000);
      await Promise.resolve();
    });

    expect(mockFetchCoinPrice).not.toHaveBeenCalled();
  });

  it('polls again after 30 seconds', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(2);
  });

  it('does NOT poll before 30 seconds have passed', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);
  });

  it('stops polling when the hook unmounts', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    const { unmount } = renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);
  });
});

describe('usePricePolling — visibility API', () => {
  it('pauses polling when the tab becomes hidden', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(1);
  });

  it('fires an immediate poll when the tab becomes visible again', async () => {
    mockFetchCoinPrice.mockResolvedValue(95_000);
    seedStore([makeOrder()]);

    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(20_000);
    });

    const countBeforeResume = mockFetchCoinPrice.mock.calls.length;

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(mockFetchCoinPrice).toHaveBeenCalledTimes(countBeforeResume + 1);
  });
});

describe('usePricePolling — error handling', () => {
  it('records a poll error but does not throw or stop polling', async () => {
    mockFetchCoinPrice.mockRejectedValueOnce(new Error('API down')).mockResolvedValue(95_000);

    seedStore([makeOrder()]);
    renderHook(() => usePricePolling());

    await act(async () => {
      await Promise.resolve();
    });

    const { pollErrors } = useOrdersStore.getState();
    expect(pollErrors['btc-bitcoin']).toContain('API down');

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(useOrdersStore.getState().pollErrors['btc-bitcoin']).toBeUndefined();
  });
});
