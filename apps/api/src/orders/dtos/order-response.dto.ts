import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';
import { Order } from '../entities/order.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';

const toNumber = (decimalString: string): number => Number(decimalString);

export class OrderCustomerDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  id: string;

  @ApiProperty({
    example: 'Grupo Sabores',
    description: 'Name snapshot taken at checkout',
  })
  name: string;
}

export class OrderItemResponseDto {
  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  id: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null if the product was deleted after the order',
  })
  productId: string | null;

  @ApiProperty({ example: 'RHB-00001' })
  sku: string;

  @ApiProperty({ example: 'LAMINADORA DE MESA PARA PIZZA' })
  name: string;

  @ApiProperty({ example: 5592, description: 'Price frozen at checkout' })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 0 })
  discountAmount: number;

  @ApiProperty({ example: 11184 })
  lineTotal: number;

  static fromEntity(orderItem: OrderItem): OrderItemResponseDto {
    const itemResponse = new OrderItemResponseDto();
    itemResponse.id = orderItem.id;
    itemResponse.productId = orderItem.productId;
    itemResponse.sku = orderItem.skuSnapshot;
    itemResponse.name = orderItem.nameSnapshot;
    itemResponse.unitPrice = toNumber(orderItem.unitPrice);
    itemResponse.quantity = orderItem.quantity;
    itemResponse.discountAmount = toNumber(orderItem.discountAmount);
    itemResponse.lineTotal = toNumber(orderItem.lineTotal);
    return itemResponse;
  }
}

export class OrderResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id: string;

  @ApiProperty({ example: 'ORD-2041' })
  orderNumber: string;

  // Only id + name snapshot — never the full User record.
  @ApiProperty({ type: OrderCustomerDto })
  customer: OrderCustomerDto;

  @ApiProperty()
  placedAt: Date;

  @ApiProperty({ enum: FulfillmentStatus })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 5 })
  totalItems: number;

  @ApiProperty({ example: 11184 })
  subtotal: number;

  @ApiProperty({ example: 0 })
  discountTotal: number;

  @ApiProperty({ example: 11184 })
  total: number;

  @ApiProperty({ example: 'GTQ' })
  currency: string;

  @ApiPropertyOptional({ nullable: true })
  appliedPromoCodeId: string | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(order: Order): OrderResponseDto {
    const orderResponse = new OrderResponseDto();
    orderResponse.id = order.id;
    orderResponse.orderNumber = order.orderNumber;
    orderResponse.customer = {
      id: order.customerId,
      name: order.customerNameSnapshot,
    };
    orderResponse.placedAt = order.placedAt;
    orderResponse.fulfillmentStatus = order.fulfillmentStatus;
    orderResponse.paymentStatus = order.paymentStatus;
    orderResponse.totalItems = order.totalItems;
    orderResponse.subtotal = toNumber(order.subtotal);
    orderResponse.discountTotal = toNumber(order.discountTotal);
    orderResponse.total = toNumber(order.total);
    orderResponse.currency = order.currency;
    orderResponse.appliedPromoCodeId = order.appliedPromoCodeId;
    orderResponse.items = (order.items ?? []).map((orderItem) =>
      OrderItemResponseDto.fromEntity(orderItem),
    );
    orderResponse.notes = order.notes;
    orderResponse.createdAt = order.createdAt;
    orderResponse.updatedAt = order.updatedAt;
    return orderResponse;
  }
}
