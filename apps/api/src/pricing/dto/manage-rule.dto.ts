import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PriceRuleScope, PriceRuleType } from '@myapp/shared';

export class CreatePriceRuleDto {
  @ApiProperty({ example: 'Trade Tier' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PriceRuleType })
  @IsEnum(PriceRuleType)
  ruleType: PriceRuleType;

  @ApiProperty({ enum: PriceRuleScope })
  @IsEnum(PriceRuleScope)
  scope: PriceRuleScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeBrandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeProductId?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'])
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiProperty({ example: 8.0 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdatePriceRuleDto extends PartialType(CreatePriceRuleDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SPRING26' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Spring fit-out campaign' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'] })
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'])
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ enum: ['CART', 'PRODUCT', 'CATEGORY'] })
  @IsEnum(['CART', 'PRODUCT', 'CATEGORY'])
  applyScope: 'CART' | 'PRODUCT' | 'CATEGORY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeProductId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesTotal?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerCustomer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdatePromoCodeDto extends PartialType(CreatePromoCodeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
