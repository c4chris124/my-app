import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  findAll(): Promise<Supplier[]> {
    return this.supplierRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  findByName(name: string): Promise<Supplier | null> {
    return this.supplierRepo.findOne({ where: { name } });
  }
}
