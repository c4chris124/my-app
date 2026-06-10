import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';
import { DeleteBrandDto } from '../dtos/delete-brand.dto.js';
import { BrandsFindRepository } from './brands-find.repository.js';

@Injectable()
export class BrandsDeleteRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly brandsFindRepository: BrandsFindRepository,
  ) {}

  async deactivate(brandId: string): Promise<DeleteBrandDto> {
    const brandToDeactivate =
      await this.brandsFindRepository.findById(brandId);

    brandToDeactivate.isActive = false;
    await this.brandRepository.save(brandToDeactivate);

    return {
      id: brandToDeactivate.id,
      message: 'Brand deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
