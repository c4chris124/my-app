import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DiscountType, PromoApplyScope } from '@myapp/shared';
import type { PromoDiscountType } from '../entities/promo-code.entity.js';

const toBooleanOrPassthrough = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value as string; // anything else is rejected by @IsBoolean
};

export class CreatePromoCodeDto {
  @ApiProperty({
    example: 'SPRING26',
    maxLength: 50,
    description: 'Stored uppercase; matched case-insensitively',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Spring fit-out campaign', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: PromoDiscountType;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Required and > 0 unless discountType is FREE_DELIVERY (then it must be omitted)',
  })
  @ValidateIf((dto: CreatePromoCodeDto) => dto.discountType !== 'FREE_DELIVERY')
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ enum: PromoApplyScope, example: PromoApplyScope.CART })
  @IsEnum(PromoApplyScope)
  applyScope: PromoApplyScope;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Required when applyScope is PRODUCT',
  })
  @ValidateIf(
    (dto: CreatePromoCodeDto) => dto.applyScope === PromoApplyScope.PRODUCT,
  )
  @IsUUID()
  scopeProductId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    description: 'Required when applyScope is CATEGORY',
  })
  @ValidateIf(
    (dto: CreatePromoCodeDto) => dto.applyScope === PromoApplyScope.CATEGORY,
  )
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 100, description: 'Omit for unlimited' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsesTotal?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsesPerCustomer?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({
    example: '2026-06-30T23:59:59Z',
    description: 'Omit for no expiry',
  })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}
