import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity.js';
import { UpdateSupplierDto } from '../dtos/update-supplier.dto.js';
import { SuppliersFindRepository } from './suppliers-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class SuppliersUpdateRepository {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly suppliersFindRepository: SuppliersFindRepository,
  ) {}

  async update(
    supplierId: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const newName = updateSupplierDto.name;
    const regeneratedSlug = newName ? toSlug(newName) : undefined;

    const updatePayload = regeneratedSlug
      ? { id: supplierId, ...updateSupplierDto, slug: regeneratedSlug }
      : { id: supplierId, ...updateSupplierDto };

    const supplierToUpdate =
      await this.supplierRepository.preload(updatePayload);
    if (!supplierToUpdate) {
      throw new NotFoundException(`Supplier with id ${supplierId} not found`);
    }

    if (newName && regeneratedSlug) {
      const otherSupplierWithSameName =
        await this.suppliersFindRepository.findByName(newName);
      if (
        otherSupplierWithSameName &&
        otherSupplierWithSameName.id !== supplierId
      ) {
        throw new ConflictException(
          `Supplier with name '${newName}' already exists`,
        );
      }

      const otherSupplierWithSameSlug =
        await this.suppliersFindRepository.findBySlug(regeneratedSlug);
      if (
        otherSupplierWithSameSlug &&
        otherSupplierWithSameSlug.id !== supplierId
      ) {
        throw new ConflictException(
          `Supplier with slug '${regeneratedSlug}' already exists`,
        );
      }
    }

    return this.supplierRepository.save(supplierToUpdate);
  }
}
