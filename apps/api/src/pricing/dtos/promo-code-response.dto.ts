import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromoApplyScope } from '@myapp/shared';
import { PromoCode } from '../entities/promo-code.entity.js';
import type { PromoDiscountType } from '../entities/promo-code.entity.js';

const toNumberOrNull = (decimalString: string | null): number | null =>
  decimalString === null ? null : Number(decimalString);

export class PromoScopeRefDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'AMASADORA COOKMATE 30 LIBRAS' })
  name: string;
}

export class PromoCodeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'SPRING26' })
  code: string;

  @ApiProperty({ example: 'Spring fit-out campaign' })
  description: string;

  @ApiProperty({ example: 'PERCENTAGE' })
  discountType: PromoDiscountType;

  @ApiPropertyOptional({ example: 10, nullable: true })
  discountValue: number | null;

  @ApiProperty({ enum: PromoApplyScope, example: PromoApplyScope.CART })
  applyScope: PromoApplyScope;

  @ApiPropertyOptional({ type: PromoScopeRefDto, nullable: true })
  scopeProduct: PromoScopeRefDto | null;

  @ApiPropertyOptional({ nullable: true })
  scopeProductId: string | null;

  @ApiPropertyOptional({ type: PromoScopeRefDto, nullable: true })
  scopeCategory: PromoScopeRefDto | null;

  @ApiPropertyOptional({ nullable: true })
  scopeCategoryId: string | null;

  @ApiProperty({ example: 1 })
  minQuantity: number;

  @ApiPropertyOptional({ example: 2500, nullable: true })
  minOrderValue: number | null;

  @ApiPropertyOptional({ example: 100, nullable: true })
  maxUsesTotal: number | null;

  @ApiProperty({ example: 1 })
  maxUsesPerCustomer: number;

  @ApiProperty({ example: 0 })
  currentUses: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  validFrom: Date | null;

  @ApiPropertyOptional({ nullable: true })
  validUntil: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(promoCode: PromoCode): PromoCodeResponseDto {
    const promoResponse = new PromoCodeResponseDto();
    promoResponse.id = promoCode.id;
    promoResponse.code = promoCode.code;
    promoResponse.description = promoCode.description;
    promoResponse.discountType = promoCode.discountType;
    promoResponse.discountValue = toNumberOrNull(promoCode.discountValue);
    promoResponse.applyScope = promoCode.applyScope;
    promoResponse.scopeProduct = promoCode.scopeProduct
      ? { id: promoCode.scopeProduct.id, name: promoCode.scopeProduct.name }
      : null;
    promoResponse.scopeProductId = promoCode.scopeProductId;
    promoResponse.scopeCategory = promoCode.scopeCategory
      ? { id: promoCode.scopeCategory.id, name: promoCode.scopeCategory.name }
      : null;
    promoResponse.scopeCategoryId = promoCode.scopeCategoryId;
    promoResponse.minQuantity = promoCode.minQuantity;
    promoResponse.minOrderValue = toNumberOrNull(promoCode.minOrderValue);
    promoResponse.maxUsesTotal = promoCode.maxUsesTotal;
    promoResponse.maxUsesPerCustomer = promoCode.maxUsesPerCustomer;
    promoResponse.currentUses = promoCode.currentUses;
    promoResponse.isActive = promoCode.isActive;
    promoResponse.validFrom = promoCode.validFrom;
    promoResponse.validUntil = promoCode.validUntil;
    promoResponse.createdAt = promoCode.createdAt;
    promoResponse.updatedAt = promoCode.updatedAt;
    return promoResponse;
  }
}

export type PromoValidationFailureReason =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'USAGE_LIMIT_REACHED';

export class PromoValidationResultDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiPropertyOptional({
    enum: [
      'NOT_FOUND',
      'INACTIVE',
      'NOT_YET_VALID',
      'EXPIRED',
      'USAGE_LIMIT_REACHED',
    ],
  })
  reason?: PromoValidationFailureReason;

  @ApiPropertyOptional({ type: PromoCodeResponseDto })
  promoCode?: PromoCodeResponseDto;
}
