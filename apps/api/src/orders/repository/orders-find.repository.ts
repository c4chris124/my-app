import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity.js';
import { OrderStatusHistory } from '../entities/order-status-history.entity.js';
import { GetOrderDto, OrderSortColumn } from '../dtos/get-order.dto.js';
import { ORDER_NUMBER_PREFIX } from '../order-number.helpers.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const SORTABLE_COLUMN_MAP: Record<OrderSortColumn, string> = {
  placedAt: 'ord.placedAt',
  total: 'ord.total',
  orderNumber: 'ord.orderNumber',
};

@Injectable()
export class OrdersFindRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
  ) {}

  /** Loads an order with items (eager) + customer. */
  async findById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { customer: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { orderNumber },
      relations: { customer: true },
    });
  }

  async findAll(query: GetOrderDto): Promise<PaginatedResult<Order>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const ordersQuery = this.orderRepository
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.customer', 'customer');

    if (query.fulfillmentStatus) {
      ordersQuery.andWhere('ord.fulfillmentStatus = :fulfillmentStatus', {
        fulfillmentStatus: query.fulfillmentStatus,
      });
    }

    if (query.paymentStatus) {
      ordersQuery.andWhere('ord.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    if (query.customerId) {
      ordersQuery.andWhere('ord.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.search) {
      ordersQuery.andWhere(
        '(ord.orderNumber ILIKE :search OR ord.customerNameSnapshot ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.placedFrom) {
      ordersQuery.andWhere('ord.placedAt >= :placedFrom', {
        placedFrom: query.placedFrom,
      });
    }

    if (query.placedTo) {
      ordersQuery.andWhere('ord.placedAt <= :placedTo', {
        placedTo: query.placedTo,
      });
    }

    const sortColumn = SORTABLE_COLUMN_MAP[query.sortBy ?? 'placedAt'];
    const sortDirection = query.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const [orders, totalOrders] = await ordersQuery
      .orderBy(sortColumn, sortDirection)
      .addOrderBy('ord.id', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: orders,
      total: totalOrders,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  /** Max numeric suffix of ORD-#### order numbers; 0 when none exist. */
  async findMaxOrderCounter(): Promise<number> {
    const maxCounterRow = await this.orderRepository
      .createQueryBuilder('ord')
      .select(
        `COALESCE(MAX(CAST(SUBSTRING(ord.orderNumber FROM '${ORDER_NUMBER_PREFIX}-([0-9]+)') AS INTEGER)), 0)`,
        'maxCounter',
      )
      .where(`ord.orderNumber ~ '^${ORDER_NUMBER_PREFIX}-[0-9]+$'`)
      .getRawOne<{ maxCounter: string | number | null }>();

    return Number(maxCounterRow?.maxCounter ?? 0);
  }

  /** Chronological status timeline; verifies the order exists first. */
  async findStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    await this.findById(orderId);
    return this.statusHistoryRepository.find({
      where: { orderId },
      order: { changedAt: 'ASC' },
    });
  }
}
