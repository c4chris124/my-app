import { QueryFailedError } from 'typeorm';

/**
 * Shared pure helpers for the product create/update repositories: decimal
 * string conversion (pg returns numerics as strings), server-side price
 * derivation, and alternate-code derivation from brandCode + explicit codes.
 */

export function toDecimalString(value: number | null): string | null {
  return value === null ? null : value.toFixed(2);
}

export interface DerivedPriceFields {
  distributorPrice: string | null;
  salePrice: string | null;
  revenue: string | null;
  marginPercent: string | null;
  pricePending: boolean;
}

export function derivePriceFields(
  distributorPrice: number | null,
  salePrice: number | null,
): DerivedPriceFields {
  const bothPricesPresent = distributorPrice !== null && salePrice !== null;
  const revenue = bothPricesPresent ? salePrice - distributorPrice : null;
  const marginPercent =
    revenue !== null && salePrice !== null && salePrice > 0
      ? (revenue / salePrice) * 100
      : null;

  return {
    distributorPrice: toDecimalString(distributorPrice),
    salePrice: toDecimalString(salePrice),
    revenue: toDecimalString(revenue),
    marginPercent: toDecimalString(marginPercent),
    pricePending: distributorPrice === null || salePrice === null,
  };
}

export function deriveAlternateCodes(
  brandCode: string,
  explicitCodes: string[],
): string[] {
  const candidateCodes = [
    ...brandCode.split(' / ').map((code) => code.trim()),
    ...explicitCodes.map((code) => code.trim()),
  ].filter((code) => code.length > 0);

  const seenNormalizedCodes = new Set<string>();
  const uniqueCodes: string[] = [];
  for (const candidateCode of candidateCodes) {
    const normalizedCode = candidateCode.toLowerCase();
    if (seenNormalizedCodes.has(normalizedCode)) continue;
    seenNormalizedCodes.add(normalizedCode);
    uniqueCodes.push(candidateCode);
  }
  return uniqueCodes;
}

export function isSkuUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as
    | { code?: string; constraint?: string }
    | undefined;
  return (
    driverError?.code === '23505' &&
    (driverError.constraint ?? '').toLowerCase().includes('sku')
  );
}
