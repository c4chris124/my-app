import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity.js';
import { CartsFindRepository } from './carts-find.repository.js';

@Injectable()
export class CartsCreateRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly cartsFindRepository: CartsFindRepository,
  ) {}

  /** Returns the customer's existing active cart, or creates an empty one. */
  async getOrCreateActiveCart(customerId: string): Promise<Cart> {
    const existingCart =
      await this.cartsFindRepository.findActiveByCustomer(customerId);
    if (existingCart) {
      return existingCart;
    }

    const newCart = this.cartRepository.create({
      customerId,
      isActive: true,
      items: [],
    });
    const savedCart = await this.cartRepository.save(newCart);
    return this.cartsFindRepository.findById(savedCart.id);
  }
}
