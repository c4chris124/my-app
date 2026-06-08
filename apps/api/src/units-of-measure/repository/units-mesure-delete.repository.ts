import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
import { DeleteUnitOfMeasureDto } from '../dtos/delete-unit-of-measure.dto.js';
import { UnitsMeasureFindRepository } from './units-mesure-find.repository.js';

@Injectable()
export class UnitsMeasureDeleteRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
    private readonly findRepo: UnitsMeasureFindRepository,
  ) {}

  async deactivate(id: string): Promise<DeleteUnitOfMeasureDto> {
    const entity = await this.findRepo.findById(id);
    entity.isActive = false;
    await this.repo.save(entity);
    return {
      id: entity.id,
      message: 'Unit of measure deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
