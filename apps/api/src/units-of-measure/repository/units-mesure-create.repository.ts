import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
import { CreateUnitOfMeasureDto } from '../dtos/create-unit-of-measure.dto.js';
import { UnitsMeasureFindRepository } from './units-mesure-find.repository.js';

@Injectable()
export class UnitsMeasureCreateRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
    private readonly findRepo: UnitsMeasureFindRepository,
  ) {}

  async create(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const existing = await this.findRepo.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Unit of measure with name '${dto.name}' already exists`,
      );
    }
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }
}
