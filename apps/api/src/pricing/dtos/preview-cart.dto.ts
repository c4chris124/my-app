import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PreviewCartItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

// Exactly ONE of `items` / `cartId` must be provided (enforced in the engine).
export class PreviewCartDto {
  @ApiPropertyOptional({ type: [PreviewCartItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewCartItemDto)
  items?: PreviewCartItemDto[];

  @ApiPropertyOptional({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: "Price this cart's current lines instead of inline items",
  })
  @IsOptional()
  @IsUUID()
  cartId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    description:
      'Resolves customerType (registered/guest) and per-customer promo limits',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: 'spring26', description: 'Case-insensitive' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
