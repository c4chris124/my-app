import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
import { UpdateUnitOfMeasureDto } from '../dtos/update-unit-of-measure.dto.js';
import { UnitsMeasureFindRepository } from './units-mesure-find.repository.js';

@Injectable()
export class UnitsMeasureUpdateRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
    private readonly findRepo: UnitsMeasureFindRepository,
  ) {}

  async update(
    id: string,
    dto: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    if (dto.name) {
      const existing = await this.findRepo.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Unit of measure with name '${dto.name}' already exists`,
        );
      }
    }

    const entity = await this.repo.preload({ id, ...dto });
    if (!entity) {
      throw new NotFoundException(`Unit of measure with id ${id} not found`);
    }
    return this.repo.save(entity);
  }
}
