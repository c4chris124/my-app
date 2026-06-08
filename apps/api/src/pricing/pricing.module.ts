import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service.js';
import { PricingController } from './pricing.controller.js';
import { PriceRule } from './entities/price-rule.entity.js';
import { PromoCode } from './entities/promo-code.entity.js';
import { PromoCodeRedemption } from './entities/promo-code-redemption.entity.js';
import { Product } from '../products/entities/product.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceRule,
      PromoCode,
      PromoCodeRedemption,
      Product,
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
