import { QueryFailedError } from 'typeorm';

export const ORDER_NUMBER_PREFIX = 'ORD';

// First order ever issued is ORD-2041 (matches the seeded CRM sample data).
export const ORDER_NUMBER_BASE_OFFSET = 2041;

/**
 * Next sequential order number from the current max numeric suffix.
 * `maxCounter` of 0 means the table is empty, where the base offset applies.
 */
export function nextOrderNumber(
  maxCounter: number,
  baseOffset: number = ORDER_NUMBER_BASE_OFFSET,
): string {
  const nextCounter = maxCounter === 0 ? baseOffset : maxCounter + 1;
  return `${ORDER_NUMBER_PREFIX}-${nextCounter}`;
}

/** Detects the rare concurrent-checkout race on the orderNumber unique index. */
export function isOrderNumberUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as
    | { code?: string; constraint?: string }
    | undefined;
  return (
    driverError?.code === '23505' &&
    (driverError.constraint ?? '').toLowerCase().includes('order_number')
  );
}
