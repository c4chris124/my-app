import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity.js';
import { GetSupplierDto } from '../dtos/get-supplier.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SuppliersFindRepository {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async findById(supplierId: string): Promise<Supplier> {
    try {
      return await this.supplierRepository.findOneByOrFail({ id: supplierId });
    } catch {
      throw new NotFoundException(`Supplier with id ${supplierId} not found`);
    }
  }

  async findAll(query: GetSupplierDto): Promise<PaginatedResult<Supplier>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const suppliersQuery =
      this.supplierRepository.createQueryBuilder('supplier');

    if (query.search) {
      suppliersQuery.andWhere('supplier.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.country) {
      suppliersQuery.andWhere('supplier.country = :country', {
        country: query.country,
      });
    }

    if (query.isActive !== undefined) {
      suppliersQuery.andWhere('supplier.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const [suppliers, totalSuppliers] = await suppliersQuery
      .orderBy('supplier.name', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: suppliers,
      total: totalSuppliers,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  async findByName(supplierName: string): Promise<Supplier | null> {
    return this.supplierRepository
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name: supplierName })
      .getOne();
  }

  async findBySlug(supplierSlug: string): Promise<Supplier | null> {
    return this.supplierRepository.findOneBy({ slug: supplierSlug });
  }
}
