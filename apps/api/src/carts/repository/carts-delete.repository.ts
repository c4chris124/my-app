import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity.js';
import { CartItem } from '../entities/cart-item.entity.js';
import { CartsFindRepository } from './carts-find.repository.js';

@Injectable()
export class CartsDeleteRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly cartsFindRepository: CartsFindRepository,
  ) {}

  /** Removes every line from the customer's active cart. */
  async clear(customerId: string): Promise<Cart> {
    const cart =
      await this.cartsFindRepository.findActiveByCustomer(customerId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    await this.cartItemRepository.delete({ cartId: cart.id });
    return this.cartsFindRepository.findById(cart.id);
  }

  /**
   * Marks a cart as no longer active (used by checkout). Accepts the
   * checkout transaction's EntityManager so the flip commits atomically
   * with the order insert.
   */
  async deactivate(cartId: string, manager?: EntityManager): Promise<void> {
    const repository = manager
      ? manager.getRepository(Cart)
      : this.cartRepository;
    await repository.update({ id: cartId }, { isActive: false });
  }
}
