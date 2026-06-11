import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity.js';
import { CreateSupplierDto } from '../dtos/create-supplier.dto.js';
import { SuppliersFindRepository } from './suppliers-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class SuppliersCreateRepository {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly suppliersFindRepository: SuppliersFindRepository,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const generatedSlug = toSlug(createSupplierDto.name);

    const supplierWithSameName = await this.suppliersFindRepository.findByName(
      createSupplierDto.name,
    );
    if (supplierWithSameName) {
      throw new ConflictException(
        `Supplier with name '${createSupplierDto.name}' already exists`,
      );
    }

    const supplierWithSameSlug =
      await this.suppliersFindRepository.findBySlug(generatedSlug);
    if (supplierWithSameSlug) {
      throw new ConflictException(
        `Supplier with slug '${generatedSlug}' already exists`,
      );
    }

    const newSupplier = this.supplierRepository.create({
      ...createSupplierDto,
      slug: generatedSlug,
    });
    return this.supplierRepository.save(newSupplier);
  }
}
