import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';
import { Cart } from '../entities/cart.entity.js';
import { CartItem } from '../entities/cart-item.entity.js';
import { CartsFindRepository } from './carts-find.repository.js';
import { CartsCreateRepository } from './carts-create.repository.js';

@Injectable()
export class CartsUpdateRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly cartsFindRepository: CartsFindRepository,
    private readonly cartsCreateRepository: CartsCreateRepository,
    private readonly productsFindRepository: ProductsFindRepository,
  ) {}

  /** Upserts a line: inserts, or increments quantity if the product is present. */
  async addItem(
    customerId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    await this.ensureProductIsOrderable(productId);

    const cart =
      await this.cartsCreateRepository.getOrCreateActiveCart(customerId);

    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.cartsFindRepository.findById(cart.id);
  }

  /** Sets a line's quantity; 0 removes the line. */
  async updateItemQty(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    const { cart, item } = await this.findOwnedItem(customerId, itemId);

    if (quantity === 0) {
      await this.cartItemRepository.remove(item);
    } else {
      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.cartsFindRepository.findById(cart.id);
  }

  async removeItem(customerId: string, itemId: string): Promise<Cart> {
    const { cart, item } = await this.findOwnedItem(customerId, itemId);
    await this.cartItemRepository.remove(item);
    return this.cartsFindRepository.findById(cart.id);
  }

  private async ensureProductIsOrderable(productId: string): Promise<Product> {
    let product: Product;
    try {
      product = await this.productsFindRepository.findById(productId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          'productId references a non-existent product',
        );
      }
      throw error;
    }
    if (!product.isActive) {
      throw new BadRequestException(
        `Product ${product.sku} is inactive and cannot be added to the cart`,
      );
    }
    return product;
  }

  private async findOwnedItem(
    customerId: string,
    itemId: string,
  ): Promise<{ cart: Cart; item: CartItem }> {
    const cart =
      await this.cartsFindRepository.findActiveByCustomer(customerId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException(`Cart item with id ${itemId} not found`);
    }
    return { cart, item };
  }
}
