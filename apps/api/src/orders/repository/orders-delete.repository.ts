import { Injectable } from '@nestjs/common';
import { FulfillmentStatus } from '@myapp/shared';
import { DeleteOrderDto } from '../dtos/delete-order.dto.js';
import { OrdersUpdateRepository } from './orders-update.repository.js';

/**
 * There is NO hard delete for orders — cancellation is a fulfillment-status
 * transition to CANCELLED, validated by the same transition map (so a
 * DELIVERED order can't be cancelled) and audited like any other change.
 */
@Injectable()
export class OrdersDeleteRepository {
  constructor(
    private readonly ordersUpdateRepository: OrdersUpdateRepository,
  ) {}

  async cancel(
    orderId: string,
    note?: string,
    changedById?: string,
  ): Promise<DeleteOrderDto> {
    const cancelledOrder =
      await this.ordersUpdateRepository.changeFulfillmentStatus(
        orderId,
        FulfillmentStatus.CANCELLED,
        note,
        changedById,
      );

    return {
      id: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
      message: 'Order cancelled successfully',
      cancelledAt: new Date(),
    };
  }
}
