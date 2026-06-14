import { Injectable } from '@nestjs/common';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';
import {
  UnitsMeasureFindRepository,
  PaginatedResult,
} from './repository/units-mesure-find.repository.js';
import { UnitsMeasureCreateRepository } from './repository/units-mesure-create.repository.js';
import { UnitsMeasureUpdateRepository } from './repository/units-mesure-update.repository.js';
import { UnitsMeasureDeleteRepository } from './repository/units-mesure-delete.repository.js';
import { CreateUnitOfMeasureDto } from './dtos/create-unit-of-measure.dto.js';
import { UpdateUnitOfMeasureDto } from './dtos/update-unit-of-measure.dto.js';
import { GetUnitOfMeasureDto } from './dtos/get-unit-of-measure.dto.js';
import { DeleteUnitOfMeasureDto } from './dtos/delete-unit-of-measure.dto.js';

@Injectable()
export class UnitsOfMeasureService {
  constructor(
    private readonly findRepo: UnitsMeasureFindRepository,
    private readonly createRepo: UnitsMeasureCreateRepository,
    private readonly updateRepo: UnitsMeasureUpdateRepository,
    private readonly deleteRepo: UnitsMeasureDeleteRepository,
  ) {}

  findAll(query: GetUnitOfMeasureDto): Promise<PaginatedResult<UnitOfMeasure>> {
    return this.findRepo.findAll(query);
  }

  findOne(id: string): Promise<UnitOfMeasure> {
    return this.findRepo.findById(id);
  }

  create(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    return this.createRepo.create(dto);
  }

  update(id: string, dto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    return this.updateRepo.update(id, dto);
  }

  remove(id: string): Promise<DeleteUnitOfMeasureDto> {
    return this.deleteRepo.deactivate(id);
  }
}
