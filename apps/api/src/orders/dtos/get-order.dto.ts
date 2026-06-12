import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';

export const ORDER_SORTABLE_COLUMNS = [
  'placedAt',
  'total',
  'orderNumber',
] as const;
export type OrderSortColumn = (typeof ORDER_SORTABLE_COLUMNS)[number];

export class GetOrderDto {
  @ApiPropertyOptional({ enum: FulfillmentStatus })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    example: 'ORD-2041',
    description: 'Matches order number or customer name (ILIKE)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  placedFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  placedTo?: string;

  @ApiPropertyOptional({ enum: ORDER_SORTABLE_COLUMNS, default: 'placedAt' })
  @IsOptional()
  @IsIn(ORDER_SORTABLE_COLUMNS)
  sortBy?: OrderSortColumn = 'placedAt';

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
