import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service.js';
import { PricingEngineService } from './pricing-engine.service.js';
import { PricingController } from './pricing.controller.js';
import { PriceRule } from './entities/price-rule.entity.js';
import { PromoCode } from './entities/promo-code.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductsModule } from '../products/products.module.js';
import { PromoCodesModule } from './promo-codes.module.js';
import { PriceRulesModule } from './price-rules.module.js';
import { RedemptionsModule } from '../redemptions/redemptions.module.js';
import { CartsModule } from '../carts/carts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceRule, PromoCode, Product]),
    ProductsModule,
    PromoCodesModule,
    PriceRulesModule,
    RedemptionsModule,
    CartsModule,
    UsersModule,
  ],
  controllers: [PricingController],
  providers: [PricingService, PricingEngineService],
  // PricingEngineService is consumed by the orders checkout transaction.
  exports: [PricingService, PricingEngineService],
})
export class PricingModule {}
