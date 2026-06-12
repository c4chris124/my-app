import { ApiProperty } from '@nestjs/swagger';
import { Cart } from '../entities/cart.entity.js';
import { CartItem } from '../entities/cart-item.entity.js';

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

export class CartItemResponseDto {
  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  productId: string;

  @ApiProperty({ example: 'RHB-00001' })
  sku: string;

  @ApiProperty({ example: 'LAMINADORA DE MESA PARA PIZZA' })
  name: string;

  @ApiProperty({
    example: 5592,
    description: 'Live product.salePrice — not frozen until checkout',
  })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 11184 })
  lineTotal: number;

  static fromEntity(cartItem: CartItem): CartItemResponseDto {
    const itemResponse = new CartItemResponseDto();
    const unitPrice = Number(cartItem.product?.salePrice ?? 0);
    itemResponse.id = cartItem.id;
    itemResponse.productId = cartItem.productId;
    itemResponse.sku = cartItem.product?.sku ?? '';
    itemResponse.name = cartItem.product?.name ?? '';
    itemResponse.unitPrice = unitPrice;
    itemResponse.quantity = cartItem.quantity;
    itemResponse.lineTotal = roundMoney(unitPrice * cartItem.quantity);
    return itemResponse;
  }
}

export class CartResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  customerId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 5, description: 'Sum of line quantities' })
  totalItems: number;

  @ApiProperty({ example: 11184, description: 'Sum of live line totals' })
  subtotal: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(cart: Cart): CartResponseDto {
    const cartResponse = new CartResponseDto();
    const itemResponses = (cart.items ?? []).map((cartItem) =>
      CartItemResponseDto.fromEntity(cartItem),
    );
    cartResponse.id = cart.id;
    cartResponse.customerId = cart.customerId;
    cartResponse.isActive = cart.isActive;
    cartResponse.items = itemResponses;
    cartResponse.totalItems = itemResponses.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    cartResponse.subtotal = roundMoney(
      itemResponses.reduce((sum, item) => sum + item.lineTotal, 0),
    );
    cartResponse.createdAt = cart.createdAt;
    cartResponse.updatedAt = cart.updatedAt;
    return cartResponse;
  }
}
