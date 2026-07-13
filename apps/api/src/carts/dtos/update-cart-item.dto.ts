import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    minimum: 0,
    description: 'New quantity for the line; 0 removes it',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}
