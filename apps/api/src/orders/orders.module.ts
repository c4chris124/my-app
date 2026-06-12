import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';
import { OrdersFindRepository } from './repository/orders-find.repository.js';
import { OrdersCreateRepository } from './repository/orders-create.repository.js';
import { OrdersUpdateRepository } from './repository/orders-update.repository.js';
import { OrdersDeleteRepository } from './repository/orders-delete.repository.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { CartsModule } from '../carts/carts.module.js';
import { ProductsModule } from '../products/products.module.js';
import { UsersModule } from '../users/users.module.js';
import { PricingModule } from '../pricing/pricing.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory]),
    CartsModule,
    ProductsModule,
    UsersModule,
    PricingModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersFindRepository,
    OrdersCreateRepository,
    OrdersUpdateRepository,
    OrdersDeleteRepository,
    OrdersService,
  ],
  // Find repo is exported for the upcoming Redemptions/reporting modules.
  exports: [OrdersService, OrdersFindRepository],
})
export class OrdersModule {}
