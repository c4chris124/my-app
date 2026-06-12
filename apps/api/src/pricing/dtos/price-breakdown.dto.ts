import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PROMO_REJECTION_REASONS = [
  'NOT_FOUND',
  'INACTIVE',
  'NOT_YET_VALID',
  'EXPIRED',
  'USAGE_LIMIT_REACHED',
  'PER_CUSTOMER_LIMIT_REACHED',
  'MIN_NOT_MET',
  'SCOPE_NOT_IN_CART',
] as const;
export type PromoRejectionReason = (typeof PROMO_REJECTION_REASONS)[number];

export class BreakdownAppliedRuleDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Trade Tier B2B' })
  name: string;

  @ApiProperty({ example: 'TRADE_TIER' })
  ruleType: string;

  @ApiProperty({ example: 160, description: 'GTQ saved on this line' })
  amountSaved: number;
}

export class BreakdownAppliedPromoDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'SPRING26' })
  code: string;

  @ApiProperty({ example: '10% de descuento en todo el carrito' })
  description: string;

  @ApiProperty({ example: 'PERCENTAGE' })
  discountType: string;

  @ApiProperty({ example: 184 })
  amountSaved: number;
}

export class PriceBreakdownLineDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  productId: string;

  @ApiProperty({ example: 'LAMINADORA DE MESA PARA PIZZA' })
  name: string;

  @ApiProperty({
    example: 1000,
    description: 'Per-unit price before discounts',
  })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ type: [BreakdownAppliedRuleDto] })
  appliedRules: BreakdownAppliedRuleDto[];

  @ApiProperty({ example: 344, description: 'Total saved on this line' })
  discountAmount: number;

  @ApiProperty({ example: 1656, description: 'Final line total' })
  lineTotal: number;
}

export class PriceBreakdownResponseDto {
  @ApiProperty({ example: 'GTQ' })
  currency: 'GTQ';

  @ApiProperty({ example: 2000, description: 'Before any discount' })
  subtotal: number;

  @ApiProperty({ example: 160 })
  ruleDiscountTotal: number;

  @ApiProperty({ example: 184 })
  promoDiscountTotal: number;

  @ApiProperty({ example: 344, description: 'Rules + promo' })
  discountTotal: number;

  @ApiProperty({
    example: 1656,
    description: 'subtotal - discountTotal (never below cost floor)',
  })
  total: number;

  @ApiProperty({ example: false })
  isFreeDelivery: boolean;

  @ApiProperty({ type: [PriceBreakdownLineDto] })
  lines: PriceBreakdownLineDto[];

  @ApiPropertyOptional({ type: BreakdownAppliedPromoDto, nullable: true })
  appliedPromo: BreakdownAppliedPromoDto | null;

  @ApiPropertyOptional({
    enum: PROMO_REJECTION_REASONS,
    description:
      'Set when a promo code was provided but could not be applied (preview returns 200 with this reason)',
  })
  promoRejectedReason?: PromoRejectionReason;
}
