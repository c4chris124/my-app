import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity.js';
import { CartItem } from './entities/cart-item.entity.js';
import { CartsFindRepository } from './repository/carts-find.repository.js';
import { CartsCreateRepository } from './repository/carts-create.repository.js';
import { CartsUpdateRepository } from './repository/carts-update.repository.js';
import { CartsDeleteRepository } from './repository/carts-delete.repository.js';
import { CartsService } from './carts.service.js';
import { CartsController } from './carts.controller.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem]), ProductsModule],
  controllers: [CartsController],
  providers: [
    CartsFindRepository,
    CartsCreateRepository,
    CartsUpdateRepository,
    CartsDeleteRepository,
    CartsService,
  ],
  // Find + Delete are consumed by the orders checkout transaction.
  exports: [CartsService, CartsFindRepository, CartsDeleteRepository],
})
export class CartsModule {}
