import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { SalesWeighting } from '@myapp/shared';

export class CreateProductDto {
  @ApiProperty({
    example: 'HS-130G / HS-130',
    maxLength: 150,
    description:
      'Original supplier code; segments separated by " / " also become alternate codes',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  brandCode: string;

  @ApiProperty({
    example: 'LAMINADORA DE MESA PARA PIZZA',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({
    example: 'Laminadora de mesa con rodillos de acero inoxidable',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacityValue?: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  capacityUnitId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 4810.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distributorPrice?: number;

  @ApiPropertyOptional({ example: 5592.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ enum: SalesWeighting, example: SalesWeighting.ALTO })
  @IsOptional()
  @IsEnum(SalesWeighting)
  salesWeighting?: SalesWeighting;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.rehobot.com/products/laminadora-1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [String], example: ['panaderia', 'pizza'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'Laminadora de Mesa | REHOBOT',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['HS-130G', 'HS-130'],
    description:
      'Extra supplier codes; merged with codes derived from brandCode',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternateCodes?: string[];
}
