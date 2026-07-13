import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity.js';
import { GetBrandDto } from '../dtos/get-brand.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BrandsFindRepository {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async findById(brandId: string): Promise<Brand> {
    try {
      return await this.brandRepository.findOneByOrFail({ id: brandId });
    } catch {
      throw new NotFoundException(`Brand with id ${brandId} not found`);
    }
  }

  async findAll(query: GetBrandDto): Promise<PaginatedResult<Brand>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const brandsQuery = this.brandRepository.createQueryBuilder('brand');

    if (query.search) {
      brandsQuery.andWhere('brand.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      brandsQuery.andWhere('brand.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const [brands, totalBrands] = await brandsQuery
      .orderBy('brand.name', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: brands,
      total: totalBrands,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  async findByName(brandName: string): Promise<Brand | null> {
    return this.brandRepository
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name: brandName })
      .getOne();
  }

  async findBySlug(brandSlug: string): Promise<Brand | null> {
    return this.brandRepository.findOneBy({ slug: brandSlug });
  }
}
