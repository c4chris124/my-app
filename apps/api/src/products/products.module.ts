import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ProductAlternateCode } from './entities/product-alternate-code.entity.js';
import { ProductsFindRepository } from './repository/products-find.repository.js';
import { ProductsCreateRepository } from './repository/products-create.repository.js';
import { ProductsUpdateRepository } from './repository/products-update.repository.js';
import { ProductsDeleteRepository } from './repository/products-delete.repository.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { BrandsModule } from '../brands/brands.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { UnitsOfMeasureModule } from '../units-of-measure/units-of-measure.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductAlternateCode]),
    BrandsModule,
    SuppliersModule,
    CategoriesModule,
    UnitsOfMeasureModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsFindRepository,
    ProductsCreateRepository,
    ProductsUpdateRepository,
    ProductsDeleteRepository,
    ProductsService,
  ],
  exports: [ProductsService, ProductsFindRepository],
})
export class ProductsModule {}
