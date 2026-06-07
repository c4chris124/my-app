import { parseGTQPrice } from './price-parser.util.js';

describe('parseGTQPrice', () => {
  it('parses European thousands+decimal format', () => {
    expect(parseGTQPrice('Q 4.810,00')).toBe(4810.0);
  });

  it('parses without thousands separator', () => {
    expect(parseGTQPrice('Q 800,00')).toBe(800.0);
  });

  it('parses large numbers', () => {
    expect(parseGTQPrice('Q 71.280,00')).toBe(71280.0);
  });

  it('returns null for Q -', () => {
    expect(parseGTQPrice('Q -')).toBeNull();
  });

  it('returns null for bare dash', () => {
    expect(parseGTQPrice('-')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseGTQPrice('')).toBeNull();
  });
});
