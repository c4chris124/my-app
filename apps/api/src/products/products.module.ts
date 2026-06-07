import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { Product } from './entities/product.entity.js';
import { ProductAlternateCode } from './entities/product-alternate-code.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductAlternateCode])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
