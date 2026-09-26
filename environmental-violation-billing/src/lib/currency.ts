const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Converts an integer amount in USD cents to a display string, e.g. 1250000 -> "$12,500.00". */
export function formatAmount(cents: number): string {
  return usdFormatter.format(cents / 100);
}
