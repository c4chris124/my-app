import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { SalesWeighting } from '@myapp/shared';

export class CreateProductDto {
  @ApiProperty({ example: 'RHB-00001' })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 'YQ-S10B' })
  @IsString()
  @MaxLength(150)
  brandCode: string;

  @ApiProperty({ example: 'AMASADORA COOKMATE 30 LIBRAS' })
  @IsString()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  capacityUnitId?: string;

  @ApiProperty()
  @IsUUID()
  brandId: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 4810.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distributorPrice?: number;

  @ApiPropertyOptional({ example: 5592.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ example: 14.0 })
  @IsOptional()
  @IsNumber()
  marginPercent?: number;

  @ApiPropertyOptional({ enum: SalesWeighting })
  @IsOptional()
  @IsEnum(SalesWeighting)
  salesWeighting?: SalesWeighting;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pricePending?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternateCodes?: string[];
}
