import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
import { GetUnitOfMeasureDto } from '../dtos/get-unit-of-measure.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UnitsMeasureFindRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly repo: Repository<UnitOfMeasure>,
  ) {}

  async findById(id: string): Promise<UnitOfMeasure> {
    try {
      return await this.repo.findOneByOrFail({ id });
    } catch {
      throw new NotFoundException(`Unit of measure with id ${id} not found`);
    }
  }

  async findAll(
    query: GetUnitOfMeasureDto,
  ): Promise<PaginatedResult<UnitOfMeasure>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder()
      .where('isActive = :isActive', { isActive: true });

    if (query.type) {
      qb.andWhere('type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere('(name ILIKE :search OR abbreviation ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findByName(name: string): Promise<UnitOfMeasure | null> {
    return this.repo
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name })
      .getOne();
  }
}
