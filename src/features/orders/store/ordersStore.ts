import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, ExecutedOrder } from '@/features/orders/types';

interface OrdersState {
  pendingOrders: Order[];
  history: ExecutedOrder[];
  /** NOT persisted — populated on the first poll cycle after page load */
  previousPrices: Record<string, number>;
  /** Last poll error message per coin (non-crashing) */
  pollErrors: Record<string, string>;

  addOrder: (order: Order) => void;
  executeOrders: (executed: ExecutedOrder[]) => void;
  cancelOrder: (orderId: string) => void;
  setPreviousPrice: (coinId: string, price: number) => void;
  setPollError: (coinId: string, error: string | null) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      pendingOrders: [],
      history: [],
      previousPrices: {},
      pollErrors: {},

      addOrder: (order) => set((state) => ({ pendingOrders: [...state.pendingOrders, order] })),

      executeOrders: (executed) =>
        set((state) => {
          const executedIds = new Set(executed.map((o) => o.id));
          return {
            pendingOrders: state.pendingOrders.filter((o) => !executedIds.has(o.id)),
            history: [...state.history, ...executed],
          };
        }),

      cancelOrder: (orderId) =>
        set((state) => ({
          pendingOrders: state.pendingOrders.filter((o) => o.id !== orderId),
        })),

      setPreviousPrice: (coinId, price) =>
        set((state) => ({
          previousPrices: { ...state.previousPrices, [coinId]: price },
        })),

      setPollError: (coinId, error) =>
        set((state) => {
          const next = { ...state.pollErrors };
          if (error === null) {
            delete next[coinId];
          } else {
            next[coinId] = error;
          }
          return { pollErrors: next };
        }),
    }),
    {
      name: 'crypto-orders',
      // Exclude runtime-only state from localStorage
      partialize: (state) => ({
        pendingOrders: state.pendingOrders,
        history: state.history,
      }),
    },
  ),
);
