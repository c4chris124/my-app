import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { UnitOfMeasure } from '../units-of-measure/entities/unit-of-measure.entity.js';
import { PriceRule } from '../pricing/entities/price-rule.entity.js';
import { PromoCode } from '../pricing/entities/promo-code.entity.js';
import { CatalogsFindRepository } from './repository/catalogs-find.repository.js';
import { CatalogsService } from './catalogs.service.js';
import { CatalogsController } from './catalogs.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Category, UnitOfMeasure, PriceRule, PromoCode])],
  controllers: [CatalogsController],
  providers: [CatalogsFindRepository, CatalogsService],
})
export class CatalogsModule {}
