import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service.js';
import { ProductImportService } from './product-import.service.js';
import { UnitOfMeasure } from '../units-of-measure/entities/unit-of-measure.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductAlternateCode } from '../products/entities/product-alternate-code.entity.js';
import { PriceRule } from '../pricing/entities/price-rule.entity.js';
import { PromoCode } from '../pricing/entities/promo-code.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UnitOfMeasure,
      Category,
      Supplier,
      Brand,
      Product,
      ProductAlternateCode,
      PriceRule,
      PromoCode,
    ]),
  ],
  providers: [SeedService, ProductImportService],
  exports: [SeedService, ProductImportService],
})
export class SeedModule {}
