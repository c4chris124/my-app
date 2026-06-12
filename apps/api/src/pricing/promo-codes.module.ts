import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from './entities/promo-code.entity.js';
import { PromoCodesFindRepository } from './repository/promo-codes-find.repository.js';
import { PromoCodesCreateRepository } from './repository/promo-codes-create.repository.js';
import { PromoCodesUpdateRepository } from './repository/promo-codes-update.repository.js';
import { PromoCodesDeleteRepository } from './repository/promo-codes-delete.repository.js';
import { PromoCodesService } from './promo-codes.service.js';
import { PromoCodesController } from './promo-codes.controller.js';
import { ProductsModule } from '../products/products.module.js';
import { CategoriesModule } from '../categories/categories.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoCode]),
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [PromoCodesController],
  providers: [
    PromoCodesFindRepository,
    PromoCodesCreateRepository,
    PromoCodesUpdateRepository,
    PromoCodesDeleteRepository,
    PromoCodesService,
  ],
  exports: [
    PromoCodesService,
    PromoCodesFindRepository,
    PromoCodesUpdateRepository,
  ],
})
export class PromoCodesModule {}
