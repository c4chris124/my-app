import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemDto } from './calculate-price.dto.js';

export class CartContextDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  orderTotal: number;
}

export class ValidatePromoDto {
  @ApiProperty({ example: 'SPRING26' })
  @IsString()
  code: string;

  @ApiProperty({ type: CartContextDto })
  @ValidateNested()
  @Type(() => CartContextDto)
  cartContext: CartContextDto;
}
