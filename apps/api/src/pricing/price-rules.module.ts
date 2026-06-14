import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceRule } from './entities/price-rule.entity.js';
import { PriceRulesFindRepository } from './repository/price-rules-find.repository.js';
import { PriceRulesCreateRepository } from './repository/price-rules-create.repository.js';
import { PriceRulesUpdateRepository } from './repository/price-rules-update.repository.js';
import { PriceRulesDeleteRepository } from './repository/price-rules-delete.repository.js';
import { PriceRulesService } from './price-rules.service.js';
import { PriceRulesController } from './price-rules.controller.js';
import { BrandsModule } from '../brands/brands.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceRule]),
    BrandsModule,
    CategoriesModule,
    ProductsModule,
  ],
  controllers: [PriceRulesController],
  providers: [
    PriceRulesFindRepository,
    PriceRulesCreateRepository,
    PriceRulesUpdateRepository,
    PriceRulesDeleteRepository,
    PriceRulesService,
  ],
  exports: [PriceRulesService, PriceRulesFindRepository],
})
export class PriceRulesModule {}
