import { Injectable } from '@nestjs/common';
import { CartsFindRepository } from './repository/carts-find.repository.js';
import { CartsCreateRepository } from './repository/carts-create.repository.js';
import { CartsUpdateRepository } from './repository/carts-update.repository.js';
import { CartsDeleteRepository } from './repository/carts-delete.repository.js';
import { AddCartItemDto } from './dtos/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto.js';
import { CartResponseDto } from './dtos/cart-response.dto.js';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartsFindRepository: CartsFindRepository,
    private readonly cartsCreateRepository: CartsCreateRepository,
    private readonly cartsUpdateRepository: CartsUpdateRepository,
    private readonly cartsDeleteRepository: CartsDeleteRepository,
  ) {}

  async getActiveCart(customerId: string): Promise<CartResponseDto> {
    const cart =
      await this.cartsCreateRepository.getOrCreateActiveCart(customerId);
    return CartResponseDto.fromEntity(cart);
  }

  async addItem(
    customerId: string,
    addCartItemDto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartsUpdateRepository.addItem(
      customerId,
      addCartItemDto.productId,
      addCartItemDto.quantity,
    );
    return CartResponseDto.fromEntity(cart);
  }

  async updateItemQty(
    customerId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartsUpdateRepository.updateItemQty(
      customerId,
      itemId,
      updateCartItemDto.quantity,
    );
    return CartResponseDto.fromEntity(cart);
  }

  async removeItem(
    customerId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.cartsUpdateRepository.removeItem(
      customerId,
      itemId,
    );
    return CartResponseDto.fromEntity(cart);
  }

  async clear(customerId: string): Promise<CartResponseDto> {
    const cart = await this.cartsDeleteRepository.clear(customerId);
    return CartResponseDto.fromEntity(cart);
  }
}
