import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppliedRuleDto {
  @ApiProperty()
  ruleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiProperty()
  discountValue: number;

  @ApiProperty()
  amountSaved: number;
}

export class AppliedPromoDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'] })
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

  @ApiPropertyOptional()
  discountValue: number | null;

  @ApiProperty()
  amountSaved: number;
}

export class PriceBreakdownDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  priceAfterRules: number;

  @ApiProperty()
  priceAfterPromo: number;

  @ApiProperty()
  totalSavings: number;

  @ApiProperty()
  isFreeDelivery: boolean;

  @ApiProperty({ type: [AppliedRuleDto] })
  appliedRules: AppliedRuleDto[];

  @ApiPropertyOptional({ type: AppliedPromoDto })
  appliedPromoCode: AppliedPromoDto | null;
}

export class ValidatePromoResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional()
  error?: string;
}
