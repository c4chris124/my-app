import { EntityManager } from 'typeorm';
import { OrderItem } from './entities/order-item.entity.js';

/**
 * ── REDEMPTIONS / PRICING SEAM ──────────────────────────────────────────────
 * Contract the upcoming Redemptions module fulfills to plug into checkout.
 * When a provider is bound to PRICING_APPLICATOR, the checkout transaction
 * calls it after snapshotting line items; the implementation must, inside the
 * SAME EntityManager transaction: validate the promo code, compute per-line
 * `discountAmount` (mutating the passed items and their lineTotals), return
 * the order-level `discountTotal` + `appliedPromoCodeId`, record a redemption
 * row, and increment the promo's `currentUses`.
 *
 * No provider exists yet, so checkout skips the seam: discountTotal stays 0
 * and no promo is applied.
 */

export const PRICING_APPLICATOR = Symbol('PRICING_APPLICATOR');

export interface PricingApplicationContext {
  /** Checkout's open transaction — all seam writes must use it. */
  manager: EntityManager;
  customerId: string;
  promoCode: string | null;
  /** Snapshotted lines; per-line discounts mutate these before insert. */
  items: OrderItem[];
  /** Sum of line totals before discounts, as a number. */
  subtotal: number;
}

export interface PricingApplicationResult {
  discountTotal: number;
  appliedPromoCodeId: string | null;
}

export interface PricingApplicator {
  apply(context: PricingApplicationContext): Promise<PricingApplicationResult>;
}
