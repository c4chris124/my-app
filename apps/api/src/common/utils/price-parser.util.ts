/**
 * Parses Guatemalan Quetzal price strings like "Q 4.810,00" or "Q -"
 * European number format: period = thousands separator, comma = decimal
 * Returns null for "Q -" (price pending)
 */
export function parseGTQPrice(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === 'Q -' || trimmed === '-' || trimmed === 'Q-') return null;
  const cleaned = trimmed
    .replace(/Q/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}
