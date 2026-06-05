import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesWeighting } from '@myapp/shared';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  brandCode: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  capacityValue: number | null;

  @ApiPropertyOptional()
  capacityUnit: string | null;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  supplier: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  distributorPrice: number | null;

  @ApiPropertyOptional()
  salePrice: number | null;

  @ApiPropertyOptional()
  revenue: number | null;

  @ApiPropertyOptional()
  marginPercent: number | null;

  @ApiPropertyOptional({ enum: SalesWeighting })
  salesWeighting: SalesWeighting | null;

  @ApiProperty()
  pricePending: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: [String] })
  alternateCodes: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
