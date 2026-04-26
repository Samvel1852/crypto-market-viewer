/** Format a price with up to 6 significant decimal places. */
export function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/** Format an ISO date string into a human-readable local date+time. */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString();
}
