import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity.js';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.brandRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
