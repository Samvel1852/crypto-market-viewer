import { create } from 'zustand';
import type { ChartPoint, Timeframe } from '@/features/chart/types';
import { fetchMarketChart } from '@/features/chart/api';

type ChartStatus = 'idle' | 'loading' | 'error';

interface SelectedCoin {
  cpId: string;
  geckoId: string;
  name: string;
}

interface ChartState {
  selectedCoin: SelectedCoin | null;
  activeTimeframe: Timeframe;
  /** Session cache: key is `${geckoId}:${timeframe}` */
  cache: Map<string, ChartPoint[]>;
  status: ChartStatus;
  error: string | null;
  /** Holds the current in-flight AbortController */
  abortController: AbortController | null;

  selectCoin: (coin: SelectedCoin) => void;
  closeCoin: () => void;
  setTimeframe: (timeframe: Timeframe) => void;
  fetchChartData: (geckoId: string, timeframe: Timeframe) => Promise<void>;
  getCachedData: (geckoId: string, timeframe: Timeframe) => ChartPoint[] | null;
}

function makeCacheKey(geckoId: string, timeframe: Timeframe): string {
  return `${geckoId}:${timeframe}`;
}

export const useChartStore = create<ChartState>()((set, get) => ({
  selectedCoin: null,
  activeTimeframe: '1D',
  cache: new Map(),
  status: 'idle',
  error: null,
  abortController: null,

  selectCoin: (coin) => {
    set({
      selectedCoin: coin,
      activeTimeframe: '1D',
      status: 'idle',
      error: null,
    });
  },

  closeCoin: () => {
    get().abortController?.abort();
    set({
      selectedCoin: null,
      status: 'idle',
      error: null,
      abortController: null,
    });
  },

  setTimeframe: (timeframe) => {
    set({ activeTimeframe: timeframe });
  },

  fetchChartData: async (geckoId, timeframe) => {
    const state = get();
    const key = makeCacheKey(geckoId, timeframe);

    // Cache hit — no network call needed
    if (state.cache.has(key)) {
      set({ status: 'idle', error: null });
      return;
    }

    // Cancel any in-flight request before starting a new one
    state.abortController?.abort();
    const controller = new AbortController();
    set({ status: 'loading', error: null, abortController: controller });

    try {
      const data = await fetchMarketChart(geckoId, timeframe, controller.signal);
      set((s) => {
        const next = new Map(s.cache);
        next.set(key, data);
        return {
          cache: next,
          status: 'idle',
          error: null,
          abortController: null,
        };
      });
    } catch (err) {
      // AbortError means a newer request superseded this one — not a real error
      if (err instanceof Error && err.name === 'AbortError') return;
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load chart data',
        abortController: null,
      });
    }
  },

  getCachedData: (geckoId, timeframe) => {
    return get().cache.get(makeCacheKey(geckoId, timeframe)) ?? null;
  },
}));
