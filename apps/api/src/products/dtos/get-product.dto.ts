import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SalesWeighting } from '@myapp/shared';

const toBooleanOrPassthrough = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value as string; // anything else is rejected by @IsBoolean
};

export const PRODUCT_SORTABLE_COLUMNS = [
  'name',
  'salePrice',
  'sortOrder',
  'createdAt',
] as const;
export type ProductSortColumn = (typeof PRODUCT_SORTABLE_COLUMNS)[number];

export class GetProductDto {
  @ApiPropertyOptional({
    example: 'amasadora',
    description: 'Full-text search (Spanish) on product name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum salePrice' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Maximum salePrice' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: SalesWeighting })
  @IsOptional()
  @IsEnum(SalesWeighting)
  salesWeighting?: SalesWeighting;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  pricePending?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBooleanOrPassthrough)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'clearance',
    description: 'Match a single tag within the tags array',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    enum: PRODUCT_SORTABLE_COLUMNS,
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(PRODUCT_SORTABLE_COLUMNS)
  sortBy?: ProductSortColumn = 'sortOrder';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC' = 'ASC';

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
