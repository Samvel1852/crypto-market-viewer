import { describe, it, expect } from 'vitest';
import { detectCrossedOrders, buildExecutedOrders } from '@/features/orders/utils';
import type { Order } from '@/features/orders/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-id',
    coinId: 'btc-bitcoin',
    coinName: 'Bitcoin',
    coinSymbol: 'BTC',
    targetPrice: 100,
    quantity: 1,
    placedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('detectCrossedOrders', () => {
  it('executes order when price drops through target (normal crossing)', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 105, 95);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(order.id);
  });

  it('executes order when price jumps past target between polls', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 105, 85);
    expect(result).toHaveLength(1);
  });

  it('executes order when price lands exactly on target', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 105, 100);
    expect(result).toHaveLength(1);
  });

  it('does NOT execute when price is above target and stays above', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 110, 105);
    expect(result).toHaveLength(0);
  });

  it('does NOT re-execute when price is already below target on previous poll', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 90, 88);
    expect(result).toHaveLength(0);
  });

  it('does NOT execute when price drops but stays above target', () => {
    const order = makeOrder({ targetPrice: 100 });
    const result = detectCrossedOrders([order], 110, 102);
    expect(result).toHaveLength(0);
  });

  it('executes ALL orders on the same coin when they cross in the same poll cycle', () => {
    const orders = [
      makeOrder({ id: 'a', targetPrice: 100 }),
      makeOrder({ id: 'b', targetPrice: 95 }),
      makeOrder({ id: 'c', targetPrice: 90 }),
    ];
    const result = detectCrossedOrders(orders, 105, 88);
    expect(result).toHaveLength(3);
    expect(result.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });

  it('executes only the orders whose targets were crossed, not others', () => {
    const orders = [
      makeOrder({ id: 'a', targetPrice: 100 }),
      makeOrder({ id: 'b', targetPrice: 80 }),
    ];
    const result = detectCrossedOrders(orders, 105, 95);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('handles an empty order list gracefully', () => {
    const result = detectCrossedOrders([], 105, 95);
    expect(result).toHaveLength(0);
  });
});

describe('buildExecutedOrders', () => {
  it('records the execution price (current poll price), not the target price', () => {
    const order = makeOrder({ targetPrice: 100 });
    const [executed] = buildExecutedOrders([order], 92, '2024-01-02T00:00:00.000Z');
    expect(executed.executionPrice).toBe(92);
    expect(executed.targetPrice).toBe(100);
  });

  it('records the timestamp of execution', () => {
    const order = makeOrder();
    const ts = '2024-06-15T12:00:00.000Z';
    const [executed] = buildExecutedOrders([order], 95, ts);
    expect(executed.executedAt).toBe(ts);
  });

  it('preserves all original order fields', () => {
    const order = makeOrder({ id: 'orig', quantity: 5, coinSymbol: 'BTC' });
    const [executed] = buildExecutedOrders([order], 95, '2024-01-01T00:00:00.000Z');
    expect(executed.id).toBe('orig');
    expect(executed.quantity).toBe(5);
    expect(executed.coinSymbol).toBe('BTC');
  });
});
