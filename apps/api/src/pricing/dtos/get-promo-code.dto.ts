import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DiscountType, PromoApplyScope } from '@myapp/shared';
import type { PromoDiscountType } from '../entities/promo-code.entity.js';

const toBooleanOrPassthrough = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value as string; // anything else is rejected by @IsBoolean
};

export class GetPromoCodeDto {
  @ApiPropertyOptional({
    example: 'spring',
    description: 'ILIKE match on code or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: PromoDiscountType;

  @ApiPropertyOptional({ enum: PromoApplyScope })
  @IsOptional()
  @IsEnum(PromoApplyScope)
  applyScope?: PromoApplyScope;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'When true, only codes usable right now (active, within date window, under usage limit)',
  })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  activeNow?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
