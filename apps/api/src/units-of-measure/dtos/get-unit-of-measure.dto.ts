import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UNIT_TYPES } from './create-unit-of-measure.dto.js';
import type { UnitType } from './create-unit-of-measure.dto.js';

export class GetUnitOfMeasureDto {
  @ApiPropertyOptional({ enum: UNIT_TYPES })
  @IsOptional()
  @IsEnum(UNIT_TYPES)
  type?: UnitType;

  @ApiPropertyOptional({ example: 'lib' })
  @IsOptional()
  @IsString()
  search?: string;

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
