import { create } from 'zustand';
import { fetchCpAllCoins } from '@/features/orders/api';
import { fetchGeckoAllCoins } from '@/features/mapping/api';
import { buildCpToGeckoMap } from '@/features/mapping/utils';

type MappingStatus = 'idle' | 'loading' | 'ready' | 'error';

interface MappingState {
  /** CoinPaprika ID → CoinGecko ID */
  cpToGecko: Map<string, string>;
  status: MappingStatus;
  error: string | null;

  /**
   * Fetch both coin lists and build the mapping.
   * Called once on app startup. Safe to call multiple times (no-ops if already loading/ready).
   */
  initialize: () => Promise<void>;

  /** Resolve a CoinPaprika ID to a CoinGecko ID. Returns undefined if not mapped. */
  resolveGeckoId: (cpId: string) => string | undefined;
}

export const useMappingStore = create<MappingState>()((set, get) => ({
  cpToGecko: new Map(),
  status: 'idle',
  error: null,

  initialize: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'ready') return;

    set({ status: 'loading', error: null });
    try {
      const [cpCoins, geckoCoins] = await Promise.all([fetchCpAllCoins(), fetchGeckoAllCoins()]);
      const cpToGecko = buildCpToGeckoMap(cpCoins, geckoCoins);
      set({ cpToGecko, status: 'ready' });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load coin mapping',
      });
    }
  },

  resolveGeckoId: (cpId) => get().cpToGecko.get(cpId),
}));
