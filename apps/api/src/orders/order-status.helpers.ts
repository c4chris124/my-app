import { BadRequestException } from '@nestjs/common';
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';

/**
 * Explicit transition maps for the two independent order state machines.
 * Direction-agnostic: "forward" and "rollback" both just consult the map —
 * a move is allowed iff `to ∈ MAP[from]`. Terminal states map to [].
 */

export const FULFILLMENT_TRANSITIONS: Record<
  FulfillmentStatus,
  FulfillmentStatus[]
> = {
  [FulfillmentStatus.PENDING]: [
    FulfillmentStatus.PROCESSING,
    FulfillmentStatus.CANCELLED,
  ],
  [FulfillmentStatus.PROCESSING]: [
    FulfillmentStatus.SHIPPED,
    FulfillmentStatus.PENDING, // rollback
    FulfillmentStatus.CANCELLED,
  ],
  [FulfillmentStatus.SHIPPED]: [
    FulfillmentStatus.DELIVERED,
    FulfillmentStatus.PROCESSING, // rollback
  ],
  [FulfillmentStatus.DELIVERED]: [
    FulfillmentStatus.SHIPPED, // rollback / correction
  ],
  [FulfillmentStatus.CANCELLED]: [], // terminal
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.UNPAID]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [
    PaymentStatus.UNPAID, // retry
    PaymentStatus.PAID,
  ],
  [PaymentStatus.REFUNDED]: [], // terminal
};

function assertTransition<TStatus extends string>(
  kind: 'fulfillment' | 'payment',
  transitions: Record<TStatus, TStatus[]>,
  from: TStatus,
  to: TStatus,
): void {
  if (from === to) {
    throw new BadRequestException(
      `Order ${kind} status is already ${from}; same-status transitions are not allowed`,
    );
  }
  if (!transitions[from]?.includes(to)) {
    throw new BadRequestException(
      `Cannot move ${kind} status from ${from} to ${to}`,
    );
  }
}

export function assertFulfillmentTransition(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): void {
  assertTransition('fulfillment', FULFILLMENT_TRANSITIONS, from, to);
}

export function assertPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): void {
  assertTransition('payment', PAYMENT_TRANSITIONS, from, to);
}
