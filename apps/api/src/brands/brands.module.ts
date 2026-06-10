import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity.js';
import { BrandsFindRepository } from './repository/brands-find.repository.js';
import { BrandsCreateRepository } from './repository/brands-create.repository.js';
import { BrandsUpdateRepository } from './repository/brands-update.repository.js';
import { BrandsDeleteRepository } from './repository/brands-delete.repository.js';
import { BrandsService } from './brands.service.js';
import { BrandsController } from './brands.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Brand])],
  controllers: [BrandsController],
  providers: [
    BrandsFindRepository,
    BrandsCreateRepository,
    BrandsUpdateRepository,
    BrandsDeleteRepository,
    BrandsService,
  ],
  exports: [BrandsService],
})
export class BrandsModule {}
