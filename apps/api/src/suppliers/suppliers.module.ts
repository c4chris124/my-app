import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity.js';
import { SuppliersFindRepository } from './repository/suppliers-find.repository.js';
import { SuppliersCreateRepository } from './repository/suppliers-create.repository.js';
import { SuppliersUpdateRepository } from './repository/suppliers-update.repository.js';
import { SuppliersDeleteRepository } from './repository/suppliers-delete.repository.js';
import { SuppliersService } from './suppliers.service.js';
import { SuppliersController } from './suppliers.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SuppliersController],
  providers: [
    SuppliersFindRepository,
    SuppliersCreateRepository,
    SuppliersUpdateRepository,
    SuppliersDeleteRepository,
    SuppliersService,
  ],
  exports: [SuppliersService, SuppliersFindRepository],
})
export class SuppliersModule {}
