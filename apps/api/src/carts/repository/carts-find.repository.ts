import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity.js';

@Injectable()
export class CartsFindRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  /** Returns the customer's ACTIVE cart or null. Never creates one. */
  async findActiveByCustomer(customerId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { customerId, isActive: true },
    });
  }

  /** Loads a cart with items + products (eager relations). */
  async findById(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({ where: { id: cartId } });
    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }
    return cart;
  }
}
