import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ValidatePromoCodeDto {
  @ApiProperty({ example: 'spring26', description: 'Case-insensitive' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    example: 3500,
    description:
      'Reserved for future cart-aware checks; ignored by the state-only validation',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderTotal?: number;
}
