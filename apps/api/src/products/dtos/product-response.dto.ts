import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesWeighting } from '@myapp/shared';
import { Product } from '../entities/product.entity.js';

const toNumberOrNull = (decimalString: string | null): number | null =>
  decimalString === null ? null : Number(decimalString);

export class ProductResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'RHB-00001' })
  sku: string;

  @ApiProperty({ example: 'HS-130G / HS-130' })
  brandCode: string;

  @ApiProperty({ example: 'LAMINADORA DE MESA PARA PIZZA' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 30, nullable: true })
  capacityValue: number | null;

  @ApiPropertyOptional({
    example: 'LBS',
    nullable: true,
    description: 'Capacity unit abbreviation (falls back to unit name)',
  })
  capacityUnit: string | null;

  @ApiPropertyOptional({ nullable: true })
  capacityUnitId: string | null;

  @ApiProperty({ example: 'COOKMATE', nullable: true })
  brand: string | null;

  @ApiProperty()
  brandId: string;

  @ApiProperty({ example: 'TECNOPAN', nullable: true })
  supplier: string | null;

  @ApiProperty()
  supplierId: string;

  @ApiProperty({ example: 'Hornos', nullable: true })
  category: string | null;

  @ApiProperty()
  categoryId: string;

  @ApiPropertyOptional({ example: 4810, nullable: true })
  distributorPrice: number | null;

  @ApiPropertyOptional({ example: 5592, nullable: true })
  salePrice: number | null;

  @ApiPropertyOptional({ example: 782, nullable: true })
  revenue: number | null;

  @ApiPropertyOptional({ example: 13.99, nullable: true })
  marginPercent: number | null;

  @ApiPropertyOptional({ enum: SalesWeighting, nullable: true })
  salesWeighting: SalesWeighting | null;

  @ApiProperty({ example: false })
  pricePending: boolean;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: [String], example: ['HS-130G', 'HS-130'] })
  alternateCodes: string[];

  @ApiPropertyOptional({ nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  metaDescription: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const productResponse = new ProductResponseDto();
    productResponse.id = product.id;
    productResponse.sku = product.sku;
    productResponse.brandCode = product.brandCode;
    productResponse.name = product.name;
    productResponse.description = product.description;
    productResponse.capacityValue = toNumberOrNull(product.capacityValue);
    productResponse.capacityUnit = product.capacityUnit
      ? (product.capacityUnit.abbreviation ?? product.capacityUnit.name)
      : null;
    productResponse.capacityUnitId = product.capacityUnitId;
    productResponse.brand = product.brand?.name ?? null;
    productResponse.brandId = product.brandId;
    productResponse.supplier = product.supplier?.name ?? null;
    productResponse.supplierId = product.supplierId;
    productResponse.category = product.category?.name ?? null;
    productResponse.categoryId = product.categoryId;
    productResponse.distributorPrice = toNumberOrNull(product.distributorPrice);
    productResponse.salePrice = toNumberOrNull(product.salePrice);
    productResponse.revenue = toNumberOrNull(product.revenue);
    productResponse.marginPercent = toNumberOrNull(product.marginPercent);
    productResponse.salesWeighting = product.salesWeighting;
    productResponse.pricePending = product.pricePending;
    productResponse.isFeatured = product.isFeatured;
    productResponse.isActive = product.isActive;
    productResponse.sortOrder = product.sortOrder;
    productResponse.imageUrls = product.imageUrls ?? [];
    productResponse.tags = product.tags ?? [];
    productResponse.alternateCodes =
      product.alternateCodes?.map((alternateCode) => alternateCode.code) ?? [];
    productResponse.metaTitle = product.metaTitle;
    productResponse.metaDescription = product.metaDescription;
    productResponse.createdAt = product.createdAt;
    productResponse.updatedAt = product.updatedAt;
    return productResponse;
  }
}
