import { Injectable, NotFoundException } from '@nestjs/common';
import { Brand } from './entities/brand.entity.js';
import {
  BrandsFindRepository,
  PaginatedResult,
} from './repository/brands-find.repository.js';
import { BrandsCreateRepository } from './repository/brands-create.repository.js';
import { BrandsUpdateRepository } from './repository/brands-update.repository.js';
import { BrandsDeleteRepository } from './repository/brands-delete.repository.js';
import { CreateBrandDto } from './dtos/create-brand.dto.js';
import { UpdateBrandDto } from './dtos/update-brand.dto.js';
import { GetBrandDto } from './dtos/get-brand.dto.js';
import { DeleteBrandDto } from './dtos/delete-brand.dto.js';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brandsFindRepository: BrandsFindRepository,
    private readonly brandsCreateRepository: BrandsCreateRepository,
    private readonly brandsUpdateRepository: BrandsUpdateRepository,
    private readonly brandsDeleteRepository: BrandsDeleteRepository,
  ) {}

  findAll(query: GetBrandDto): Promise<PaginatedResult<Brand>> {
    return this.brandsFindRepository.findAll(query);
  }

  findOne(brandId: string): Promise<Brand> {
    return this.brandsFindRepository.findById(brandId);
  }

  async findBySlug(brandSlug: string): Promise<Brand> {
    const brand = await this.brandsFindRepository.findBySlug(brandSlug);
    if (!brand) {
      throw new NotFoundException(`Brand with slug '${brandSlug}' not found`);
    }
    return brand;
  }

  create(createBrandDto: CreateBrandDto): Promise<Brand> {
    return this.brandsCreateRepository.create(createBrandDto);
  }

  update(brandId: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    return this.brandsUpdateRepository.update(brandId, updateBrandDto);
  }

  remove(brandId: string): Promise<DeleteBrandDto> {
    return this.brandsDeleteRepository.deactivate(brandId);
  }
}
