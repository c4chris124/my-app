import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity.js';
import { DeleteSupplierDto } from '../dtos/delete-supplier.dto.js';
import { SuppliersFindRepository } from './suppliers-find.repository.js';

@Injectable()
export class SuppliersDeleteRepository {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly suppliersFindRepository: SuppliersFindRepository,
  ) {}

  async deactivate(supplierId: string): Promise<DeleteSupplierDto> {
    const supplierToDeactivate =
      await this.suppliersFindRepository.findById(supplierId);

    supplierToDeactivate.isActive = false;
    await this.supplierRepository.save(supplierToDeactivate);

    return {
      id: supplierToDeactivate.id,
      message: 'Supplier deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
