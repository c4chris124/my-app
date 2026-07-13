import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  FulfillmentStatus,
  OrderStatusKind,
  PaymentStatus,
} from '@myapp/shared';
import { Order } from '../entities/order.entity.js';
import { OrderStatusHistory } from '../entities/order-status-history.entity.js';
import {
  assertFulfillmentTransition,
  assertPaymentTransition,
} from '../order-status.helpers.js';
import { OrdersFindRepository } from './orders-find.repository.js';

/**
 * Orders are immutable after checkout — the ONLY mutable fields are the two
 * status columns, each guarded by its transition map and audited in
 * order_status_history. There is intentionally no generic update method.
 */
@Injectable()
export class OrdersUpdateRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ordersFindRepository: OrdersFindRepository,
  ) {}

  async changeFulfillmentStatus(
    orderId: string,
    to: FulfillmentStatus,
    note?: string,
    changedById?: string,
  ): Promise<Order> {
    await this.dataSource.transaction(async (manager) => {
      const order = await this.loadForUpdate(manager, orderId);
      assertFulfillmentTransition(order.fulfillmentStatus, to);

      const fromStatus = order.fulfillmentStatus;
      order.fulfillmentStatus = to;
      await manager.getRepository(Order).save(order);
      await manager.getRepository(OrderStatusHistory).save(
        manager.getRepository(OrderStatusHistory).create({
          orderId: order.id,
          statusKind: OrderStatusKind.FULFILLMENT,
          fromStatus,
          toStatus: to,
          note: note ?? null,
          changedById: changedById ?? null,
        }),
      );
    });

    return this.ordersFindRepository.findById(orderId);
  }

  async changePaymentStatus(
    orderId: string,
    to: PaymentStatus,
    note?: string,
    changedById?: string,
  ): Promise<Order> {
    await this.dataSource.transaction(async (manager) => {
      const order = await this.loadForUpdate(manager, orderId);
      assertPaymentTransition(order.paymentStatus, to);

      const fromStatus = order.paymentStatus;
      order.paymentStatus = to;
      await manager.getRepository(Order).save(order);
      await manager.getRepository(OrderStatusHistory).save(
        manager.getRepository(OrderStatusHistory).create({
          orderId: order.id,
          statusKind: OrderStatusKind.PAYMENT,
          fromStatus,
          toStatus: to,
          note: note ?? null,
          changedById: changedById ?? null,
        }),
      );
    });

    return this.ordersFindRepository.findById(orderId);
  }

  private async loadForUpdate(
    manager: EntityManager,
    orderId: string,
  ): Promise<Order> {
    const order = await manager
      .getRepository(Order)
      .findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
    return order;
  }
}
