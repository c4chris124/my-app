import { QueryFailedError } from 'typeorm';
import {
  deriveAlternateCodes,
  derivePriceFields,
  isSkuUniqueViolation,
  toDecimalString,
} from '../../src/products/repository/product-write.helpers.js';

// ---------------------------------------------------------------------------
// deriveAlternateCodes — brandCode splitting + explicit codes + dedupe
// ---------------------------------------------------------------------------

describe('deriveAlternateCodes', () => {
  it('splits a compound brandCode on " / " into individual codes', () => {
    expect(deriveAlternateCodes('HS-130G / HS-130', [])).toEqual([
      'HS-130G',
      'HS-130',
    ]);
  });

  it('returns a single-code brandCode as one alternate code', () => {
    expect(deriveAlternateCodes('FP-30', [])).toEqual(['FP-30']);
  });

  it('appends explicit codes after the brandCode-derived ones', () => {
    expect(deriveAlternateCodes('HS-130G', ['EXTRA-1', 'EXTRA-2'])).toEqual([
      'HS-130G',
      'EXTRA-1',
      'EXTRA-2',
    ]);
  });

  it('trims whitespace from every candidate code', () => {
    expect(
      deriveAlternateCodes('  HS-130G  /  HS-130 ', ['  EXTRA-1 ']),
    ).toEqual(['HS-130G', 'HS-130', 'EXTRA-1']);
  });

  it('drops empty fragments produced by trimming', () => {
    expect(deriveAlternateCodes('HS-130G /  ', ['', '   '])).toEqual([
      'HS-130G',
    ]);
  });

  it('dedupes case-insensitively, keeping the first casing seen', () => {
    expect(deriveAlternateCodes('HS-130G / hs-130g', ['HS-130G'])).toEqual([
      'HS-130G',
    ]);
  });

  it('dedupes an explicit code that repeats a brandCode fragment', () => {
    expect(deriveAlternateCodes('HS-130G / HS-130', ['HS-130'])).toEqual([
      'HS-130G',
      'HS-130',
    ]);
  });

  it('preserves insertion order across brandCode and explicit codes', () => {
    expect(
      deriveAlternateCodes('B-CODE / A-CODE', ['Z-CODE', 'C-CODE']),
    ).toEqual(['B-CODE', 'A-CODE', 'Z-CODE', 'C-CODE']);
  });
});

// ---------------------------------------------------------------------------
// toDecimalString — pg numeric boundary
// ---------------------------------------------------------------------------

describe('toDecimalString', () => {
  it('formats a number to a 2-decimal string', () => {
    expect(toDecimalString(4810)).toBe('4810.00');
    expect(toDecimalString(13.989)).toBe('13.99');
  });

  it('passes null through unchanged', () => {
    expect(toDecimalString(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// derivePriceFields — revenue / margin / pricePending derivation
// ---------------------------------------------------------------------------

describe('derivePriceFields', () => {
  it('derives revenue and margin when both prices are present', () => {
    const fields = derivePriceFields(4810, 5592);

    expect(fields.distributorPrice).toBe('4810.00');
    expect(fields.salePrice).toBe('5592.00');
    expect(fields.revenue).toBe('782.00');
    expect(fields.marginPercent).toBe('13.98'); // (782 / 5592) * 100
    expect(fields.pricePending).toBe(false);
  });

  it('marks the price as pending when distributorPrice is missing', () => {
    const fields = derivePriceFields(null, 5592);

    expect(fields.revenue).toBeNull();
    expect(fields.marginPercent).toBeNull();
    expect(fields.pricePending).toBe(true);
  });

  it('marks the price as pending when salePrice is missing', () => {
    const fields = derivePriceFields(4810, null);

    expect(fields.salePrice).toBeNull();
    expect(fields.revenue).toBeNull();
    expect(fields.pricePending).toBe(true);
  });

  it('avoids a division by zero when salePrice is 0', () => {
    const fields = derivePriceFields(0, 0);

    expect(fields.revenue).toBe('0.00');
    expect(fields.marginPercent).toBeNull();
    expect(fields.pricePending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSkuUniqueViolation — retry trigger for the generated-SKU race
// ---------------------------------------------------------------------------

describe('isSkuUniqueViolation', () => {
  const makeQueryFailedError = (driverError: {
    code?: string;
    constraint?: string;
  }): QueryFailedError => {
    const error = new QueryFailedError('INSERT INTO products ...', [], {
      message: 'duplicate key value violates unique constraint',
    } as never);
    (error as unknown as { driverError: unknown }).driverError = driverError;
    return error;
  };

  it('detects a 23505 violation on a sku constraint', () => {
    const error = makeQueryFailedError({
      code: '23505',
      constraint: 'idx_products_sku',
    });

    expect(isSkuUniqueViolation(error)).toBe(true);
  });

  it('ignores 23505 violations on non-sku constraints', () => {
    const error = makeQueryFailedError({
      code: '23505',
      constraint: 'uq_alternate_codes_code',
    });

    expect(isSkuUniqueViolation(error)).toBe(false);
  });

  it('ignores non-unique-violation driver errors', () => {
    const error = makeQueryFailedError({
      code: '23503',
      constraint: 'fk_products_brand',
    });

    expect(isSkuUniqueViolation(error)).toBe(false);
  });

  it('ignores plain errors that are not QueryFailedError', () => {
    expect(isSkuUniqueViolation(new Error('duplicate sku'))).toBe(false);
    expect(isSkuUniqueViolation(undefined)).toBe(false);
  });
});
