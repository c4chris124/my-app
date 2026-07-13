import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export type UnitType = 'weight' | 'volume' | 'count' | 'length';
export const UNIT_TYPES: UnitType[] = ['weight', 'volume', 'count', 'length'];

export class CreateUnitOfMeasureDto {
  @ApiProperty({ example: 'Libras' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'lbs' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  abbreviation: string;

  @ApiProperty({ example: 'weight', enum: UNIT_TYPES })
  @IsEnum(UNIT_TYPES)
  type: UnitType;
}
