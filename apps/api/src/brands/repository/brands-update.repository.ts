import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';
import { UpdateBrandDto } from '../dtos/update-brand.dto.js';
import { BrandsFindRepository } from './brands-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class BrandsUpdateRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly brandsFindRepository: BrandsFindRepository,
  ) {}

  async update(brandId: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const newName = updateBrandDto.name;
    const regeneratedSlug = newName ? toSlug(newName) : undefined;

    const updatePayload = regeneratedSlug
      ? { id: brandId, ...updateBrandDto, slug: regeneratedSlug }
      : { id: brandId, ...updateBrandDto };

    const brandToUpdate = await this.brandRepository.preload(updatePayload);
    if (!brandToUpdate) {
      throw new NotFoundException(`Brand with id ${brandId} not found`);
    }

    if (newName && regeneratedSlug) {
      const otherBrandWithSameName =
        await this.brandsFindRepository.findByName(newName);
      if (otherBrandWithSameName && otherBrandWithSameName.id !== brandId) {
        throw new ConflictException(
          `Brand with name '${newName}' already exists`,
        );
      }

      const otherBrandWithSameSlug =
        await this.brandsFindRepository.findBySlug(regeneratedSlug);
      if (otherBrandWithSameSlug && otherBrandWithSameSlug.id !== brandId) {
        throw new ConflictException(
          `Brand with slug '${regeneratedSlug}' already exists`,
        );
      }
    }

    return this.brandRepository.save(brandToUpdate);
  }
}
