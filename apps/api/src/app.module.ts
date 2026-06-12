import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import authConfig from './config/auth.config.js';
import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { RedisModule } from './redis/redis.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { PromoCodesModule } from './pricing/promo-codes.module.js';
import { PriceRulesModule } from './pricing/price-rules.module.js';
import { CartsModule } from './carts/carts.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SeedModule } from './seed/seed.module.js';
import { UnitsOfMeasureModule } from './units-of-measure/units-of-measure.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [authConfig],
      validate: validateEnv,
    }),
    DatabaseModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    SuppliersModule,
    PricingModule,
    PromoCodesModule,
    PriceRulesModule,
    CartsModule,
    OrdersModule,
    SeedModule,
    UnitsOfMeasureModule,
    CatalogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
