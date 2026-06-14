import { PartialType } from '@nestjs/mapped-types';
import { CreateUnitOfMeasureDto } from './create-unit-of-measure.dto.js';

export class UpdateUnitOfMeasureDto extends PartialType(
  CreateUnitOfMeasureDto,
) {}
