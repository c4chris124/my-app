import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsIn,
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
import { PriceRuleScope, PriceRuleType } from '@myapp/shared';
import type { RuleDiscountType } from '../entities/price-rule.entity.js';

const toBooleanOrPassthrough = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value as string; // anything else is rejected by @IsBoolean
};

export const RULE_DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;

export class CreatePriceRuleDto {
  @ApiProperty({ example: 'Volume 10+', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Automatic discount for orders of 10 or more units',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PriceRuleType, example: PriceRuleType.VOLUME })
  @IsEnum(PriceRuleType)
  ruleType: PriceRuleType;

  @ApiProperty({
    enum: PriceRuleScope,
    example: PriceRuleScope.ALL_PRODUCTS,
  })
  @IsEnum(PriceRuleScope)
  scope: PriceRuleScope;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    description: 'Required when scope is CATEGORY',
  })
  @ValidateIf(
    (dto: CreatePriceRuleDto) => dto.scope === PriceRuleScope.CATEGORY,
  )
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Required when scope is BRAND',
  })
  @ValidateIf((dto: CreatePriceRuleDto) => dto.scope === PriceRuleScope.BRAND)
  @IsUUID()
  scopeBrandId?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'Required when scope is PRODUCT',
  })
  @ValidateIf((dto: CreatePriceRuleDto) => dto.scope === PriceRuleScope.PRODUCT)
  @IsUUID()
  scopeProductId?: string;

  @ApiPropertyOptional({
    enum: RULE_DISCOUNT_TYPES,
    default: 'PERCENTAGE',
  })
  @IsOptional()
  @IsIn(RULE_DISCOUNT_TYPES)
  discountType?: RuleDiscountType;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({
    example: 20,
    default: 0,
    description: 'Higher priority rules are evaluated first',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isStackable?: boolean;

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
