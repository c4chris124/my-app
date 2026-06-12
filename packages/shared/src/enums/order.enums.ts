/** Physical lifecycle of an order. Transitions enforced in the API. */
export enum FulfillmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/** Money lifecycle of an order; moves independently of fulfillment. */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

/** Which state machine a status-history entry belongs to. */
export enum OrderStatusKind {
  FULFILLMENT = 'FULFILLMENT',
  PAYMENT = 'PAYMENT',
}
