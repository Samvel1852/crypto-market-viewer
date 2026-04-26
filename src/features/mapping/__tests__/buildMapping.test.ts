import { describe, it, expect } from 'vitest';
import { buildCpToGeckoMap } from '@/features/mapping/utils';
import type { CpCoin, GeckoCoin } from '@/features/mapping/types';

const btcCp: CpCoin = { id: 'btc-bitcoin', symbol: 'BTC', name: 'Bitcoin' };
const ethCp: CpCoin = { id: 'eth-ethereum', symbol: 'ETH', name: 'Ethereum' };
const unknownCp: CpCoin = { id: 'xyz-unknowncoin', symbol: 'XYZ', name: 'UnknownCoin' };

const btcGecko: GeckoCoin = { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' };
const ethGecko: GeckoCoin = { id: 'ethereum', symbol: 'eth', name: 'Ethereum' };

describe('buildCpToGeckoMap', () => {
  it('maps CoinPaprika ID to CoinGecko ID for a matched coin', () => {
    const map = buildCpToGeckoMap([btcCp], [btcGecko]);
    expect(map.get('btc-bitcoin')).toBe('bitcoin');
  });

  it('maps multiple coins correctly', () => {
    const map = buildCpToGeckoMap([btcCp, ethCp], [btcGecko, ethGecko]);
    expect(map.get('btc-bitcoin')).toBe('bitcoin');
    expect(map.get('eth-ethereum')).toBe('ethereum');
  });

  it('returns undefined for a coin not in CoinGecko', () => {
    const map = buildCpToGeckoMap([unknownCp], [btcGecko, ethGecko]);
    expect(map.get('xyz-unknowncoin')).toBeUndefined();
  });

  it('is case-insensitive for symbol and name matching', () => {
    const cp: CpCoin = { id: 'btc-bitcoin', symbol: 'BTC', name: 'Bitcoin' };
    const gecko: GeckoCoin = { id: 'bitcoin', symbol: 'btc', name: 'bitcoin' };
    const map = buildCpToGeckoMap([cp], [gecko]);
    expect(map.get('btc-bitcoin')).toBe('bitcoin');
  });

  it('does not match a coin where symbol matches but name does not', () => {
    const imposter: CpCoin = { id: 'btc-fake', symbol: 'BTC', name: 'Fake Bitcoin' };
    const map = buildCpToGeckoMap([imposter], [btcGecko]);
    expect(map.get('btc-fake')).toBeUndefined();
  });

  it('handles empty inputs gracefully', () => {
    expect(buildCpToGeckoMap([], [])).toEqual(new Map());
    expect(buildCpToGeckoMap([btcCp], [])).toEqual(new Map());
    expect(buildCpToGeckoMap([], [btcGecko])).toEqual(new Map());
  });

  it('does not include unmapped coins in the result', () => {
    const map = buildCpToGeckoMap([btcCp, unknownCp], [btcGecko]);
    expect(map.size).toBe(1);
    expect(map.has('xyz-unknowncoin')).toBe(false);
  });

  it('first entry wins when CoinGecko has duplicate symbol+name entries', () => {
    const dup1: GeckoCoin = { id: 'bitcoin-first', symbol: 'btc', name: 'bitcoin' };
    const dup2: GeckoCoin = { id: 'bitcoin-second', symbol: 'btc', name: 'bitcoin' };
    const map = buildCpToGeckoMap([btcCp], [dup1, dup2]);
    expect(map.get('btc-bitcoin')).toBe('bitcoin-first');
  });
});
