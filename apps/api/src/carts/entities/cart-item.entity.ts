import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { Cart } from './cart.entity.js';

@Entity('cart_items')
// Adding an already-present product increments quantity instead of inserting.
@Unique('uq_cart_items_cart_product', ['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_cart_items_cart_id')
  @Column({ type: 'uuid' })
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Index('idx_cart_items_product_id')
  @Column({ type: 'uuid' })
  productId: string;

  // Eager so cart responses can compute live prices from product.salePrice.
  @ManyToOne(() => Product, { nullable: false, eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;
}
