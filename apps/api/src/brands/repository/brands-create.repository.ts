import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';
import { CreateBrandDto } from '../dtos/create-brand.dto.js';
import { BrandsFindRepository } from './brands-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class BrandsCreateRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly brandsFindRepository: BrandsFindRepository,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const generatedSlug = toSlug(createBrandDto.name);

    const brandWithSameName = await this.brandsFindRepository.findByName(
      createBrandDto.name,
    );
    if (brandWithSameName) {
      throw new ConflictException(
        `Brand with name '${createBrandDto.name}' already exists`,
      );
    }

    const brandWithSameSlug =
      await this.brandsFindRepository.findBySlug(generatedSlug);
    if (brandWithSameSlug) {
      throw new ConflictException(
        `Brand with slug '${generatedSlug}' already exists`,
      );
    }

    const newBrand = this.brandRepository.create({
      ...createBrandDto,
      slug: generatedSlug,
    });
    return this.brandRepository.save(newBrand);
  }
}
