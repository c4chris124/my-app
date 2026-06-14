import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';
import { Order } from '../entities/order.entity.js';

// Lean row for the CRM orders table.
export class OrderListItemDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id: string;

  @ApiProperty({ example: 'ORD-2041' })
  orderNumber: string;

  @ApiProperty({ example: 'Grupo Sabores' })
  customerName: string;

  @ApiProperty()
  placedAt: Date;

  @ApiProperty({ enum: FulfillmentStatus })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 5 })
  totalItems: number;

  @ApiProperty({ example: 11184 })
  total: number;

  static fromEntity(order: Order): OrderListItemDto {
    const listItem = new OrderListItemDto();
    listItem.id = order.id;
    listItem.orderNumber = order.orderNumber;
    listItem.customerName = order.customerNameSnapshot;
    listItem.placedAt = order.placedAt;
    listItem.fulfillmentStatus = order.fulfillmentStatus;
    listItem.paymentStatus = order.paymentStatus;
    listItem.totalItems = order.totalItems;
    listItem.total = Number(order.total);
    return listItem;
  }
}
