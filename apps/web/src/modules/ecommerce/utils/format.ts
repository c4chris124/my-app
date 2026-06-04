/**
 * Format a price using the active locale. Falls back gracefully if the runtime
 * lacks Intl support for the given currency.
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
