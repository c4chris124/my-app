import { Injectable } from '@nestjs/common';
import {
  OrdersFindRepository,
  PaginatedResult,
} from './repository/orders-find.repository.js';
import { OrdersCreateRepository } from './repository/orders-create.repository.js';
import { OrdersUpdateRepository } from './repository/orders-update.repository.js';
import { OrdersDeleteRepository } from './repository/orders-delete.repository.js';
import { CheckoutDto } from './dtos/checkout.dto.js';
import {
  ChangeFulfillmentStatusDto,
  ChangePaymentStatusDto,
} from './dtos/change-status.dto.js';
import { GetOrderDto } from './dtos/get-order.dto.js';
import { CancelOrderDto, DeleteOrderDto } from './dtos/delete-order.dto.js';
import { OrderResponseDto } from './dtos/order-response.dto.js';
import { OrderListItemDto } from './dtos/order-list-item.dto.js';
import { OrderStatusHistoryItemDto } from './dtos/order-status-history-item.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersFindRepository: OrdersFindRepository,
    private readonly ordersCreateRepository: OrdersCreateRepository,
    private readonly ordersUpdateRepository: OrdersUpdateRepository,
    private readonly ordersDeleteRepository: OrdersDeleteRepository,
  ) {}

  async findAll(
    query: GetOrderDto,
  ): Promise<PaginatedResult<OrderListItemDto>> {
    const paginatedOrders = await this.ordersFindRepository.findAll(query);
    return {
      ...paginatedOrders,
      data: paginatedOrders.data.map((order) =>
        OrderListItemDto.fromEntity(order),
      ),
    };
  }

  async findOne(orderId: string): Promise<OrderResponseDto> {
    const order = await this.ordersFindRepository.findById(orderId);
    return OrderResponseDto.fromEntity(order);
  }

  async findStatusHistory(
    orderId: string,
  ): Promise<OrderStatusHistoryItemDto[]> {
    const historyEntries =
      await this.ordersFindRepository.findStatusHistory(orderId);
    return historyEntries.map((entry) =>
      OrderStatusHistoryItemDto.fromEntity(entry),
    );
  }

  async checkout(
    customerId: string,
    checkoutDto: CheckoutDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersCreateRepository.checkout({
      ...checkoutDto,
      customerId,
    });
    return OrderResponseDto.fromEntity(order);
  }

  async changeFulfillmentStatus(
    orderId: string,
    changeStatusDto: ChangeFulfillmentStatusDto,
    changedById?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersUpdateRepository.changeFulfillmentStatus(
      orderId,
      changeStatusDto.status,
      changeStatusDto.note,
      changedById,
    );
    return OrderResponseDto.fromEntity(order);
  }

  async changePaymentStatus(
    orderId: string,
    changeStatusDto: ChangePaymentStatusDto,
    changedById?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersUpdateRepository.changePaymentStatus(
      orderId,
      changeStatusDto.status,
      changeStatusDto.note,
      changedById,
    );
    return OrderResponseDto.fromEntity(order);
  }

  cancel(
    orderId: string,
    cancelOrderDto: CancelOrderDto,
    changedById?: string,
  ): Promise<DeleteOrderDto> {
    return this.ordersDeleteRepository.cancel(
      orderId,
      cancelOrderDto.note,
      changedById,
    );
  }
}
