import type { CpCoin, GeckoCoin } from '@/features/mapping/types';

/**
 * Build a lookup table from CoinPaprika IDs → CoinGecko IDs.
 *
 * Matching strategy: normalize both symbol AND name to lowercase and match
 * on the combined key. Using both fields significantly reduces false positives
 * that would occur from matching on symbol alone (many coins share symbols).
 */
export function buildCpToGeckoMap(cpCoins: CpCoin[], geckoCoins: GeckoCoin[]): Map<string, string> {
  // Index CoinGecko coins by `${symbol.lower}:${name.lower}` for O(1) lookup
  const geckoIndex = new Map<string, string>();
  for (const coin of geckoCoins) {
    const key = makeKey(coin.symbol, coin.name);
    // First entry wins — avoids overwriting with duplicates
    if (!geckoIndex.has(key)) {
      geckoIndex.set(key, coin.id);
    }
  }

  const mapping = new Map<string, string>();
  for (const coin of cpCoins) {
    const geckoId = geckoIndex.get(makeKey(coin.symbol, coin.name));
    if (geckoId) {
      mapping.set(coin.id, geckoId);
    }
  }
  return mapping;
}

function makeKey(symbol: string, name: string): string {
  return `${symbol.toLowerCase()}:${name.toLowerCase()}`;
}
