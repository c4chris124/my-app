/**
 * Generates URL-safe slugs from Spanish text, handling accented characters.
 * e.g. 'Estufas e Inducción' → 'estufas-e-induccion'
 */
export function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
