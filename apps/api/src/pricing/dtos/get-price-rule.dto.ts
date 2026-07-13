import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PriceRuleScope, PriceRuleType } from '@myapp/shared';

const toBooleanOrPassthrough = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value as string; // anything else is rejected by @IsBoolean
};

export const PRICE_RULE_SORTABLE_COLUMNS = [
  'priority',
  'name',
  'discountValue',
  'createdAt',
] as const;
export type PriceRuleSortColumn = (typeof PRICE_RULE_SORTABLE_COLUMNS)[number];

export class GetPriceRuleDto {
  @ApiPropertyOptional({
    example: 'volume',
    description: 'ILIKE match on name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PriceRuleType })
  @IsOptional()
  @IsEnum(PriceRuleType)
  ruleType?: PriceRuleType;

  @ApiPropertyOptional({ enum: PriceRuleScope })
  @IsOptional()
  @IsEnum(PriceRuleScope)
  scope?: PriceRuleScope;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsOptional()
  @IsUUID()
  scopeCategoryId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  scopeBrandId?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  scopeProductId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'When true, only rules usable right now (active and within date window)',
  })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  activeNow?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({
    enum: PRICE_RULE_SORTABLE_COLUMNS,
    default: 'priority',
  })
  @IsOptional()
  @IsIn(PRICE_RULE_SORTABLE_COLUMNS)
  sortBy?: PriceRuleSortColumn = 'priority';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC' = 'DESC';

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
