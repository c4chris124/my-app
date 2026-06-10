import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from './entities/supplier.entity.js';
import {
  SuppliersFindRepository,
  PaginatedResult,
} from './repository/suppliers-find.repository.js';
import { SuppliersCreateRepository } from './repository/suppliers-create.repository.js';
import { SuppliersUpdateRepository } from './repository/suppliers-update.repository.js';
import { SuppliersDeleteRepository } from './repository/suppliers-delete.repository.js';
import { CreateSupplierDto } from './dtos/create-supplier.dto.js';
import { UpdateSupplierDto } from './dtos/update-supplier.dto.js';
import { GetSupplierDto } from './dtos/get-supplier.dto.js';
import { DeleteSupplierDto } from './dtos/delete-supplier.dto.js';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliersFindRepository: SuppliersFindRepository,
    private readonly suppliersCreateRepository: SuppliersCreateRepository,
    private readonly suppliersUpdateRepository: SuppliersUpdateRepository,
    private readonly suppliersDeleteRepository: SuppliersDeleteRepository,
  ) {}

  findAll(query: GetSupplierDto): Promise<PaginatedResult<Supplier>> {
    return this.suppliersFindRepository.findAll(query);
  }

  findOne(supplierId: string): Promise<Supplier> {
    return this.suppliersFindRepository.findById(supplierId);
  }

  async findBySlug(supplierSlug: string): Promise<Supplier> {
    const supplier =
      await this.suppliersFindRepository.findBySlug(supplierSlug);
    if (!supplier) {
      throw new NotFoundException(
        `Supplier with slug '${supplierSlug}' not found`,
      );
    }
    return supplier;
  }

  create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliersCreateRepository.create(createSupplierDto);
  }

  update(
    supplierId: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersUpdateRepository.update(supplierId, updateSupplierDto);
  }

  remove(supplierId: string): Promise<DeleteSupplierDto> {
    return this.suppliersDeleteRepository.deactivate(supplierId);
  }
}
