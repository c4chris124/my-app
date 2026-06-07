import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service.js';
import { Supplier } from './entities/supplier.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
