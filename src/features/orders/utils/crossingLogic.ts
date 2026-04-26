import type { Order, ExecutedOrder } from '@/features/orders/types';

/**
 * Given previous and current prices for a coin, return the subset of pending
 * orders that should now execute — i.e. those whose target was crossed from
 * above between the two poll cycles.
 *
 * The rule: prevPrice > order.targetPrice && currentPrice <= order.targetPrice
 *
 * This correctly handles:
 *   - Normal crossings (price slowly drops through the target)
 *   - Price jumps (price skips past the target in one poll gap)
 *   - No false re-execution (once price is below target and stays there)
 */
export function detectCrossedOrders(
  orders: Order[],
  prevPrice: number,
  currentPrice: number,
): Order[] {
  return orders.filter(
    (order) => prevPrice > order.targetPrice && currentPrice <= order.targetPrice,
  );
}

/**
 * Build ExecutedOrder records from orders that crossed in this poll cycle.
 * The execution price is the CURRENT poll price (not the target price).
 */
export function buildExecutedOrders(
  crossedOrders: Order[],
  executionPrice: number,
  executedAt: string,
): ExecutedOrder[] {
  return crossedOrders.map((order) => ({
    ...order,
    executionPrice,
    executedAt,
  }));
}
