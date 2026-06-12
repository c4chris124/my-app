import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { CartItem } from './cart-item.entity.js';

// Live, mutable basket. Prices are never stored here — responses read the
// current product.salePrice; amounts only freeze at checkout (order_items).
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // One ACTIVE cart per customer; enforced by getOrCreateActiveCart.
  @Index('idx_carts_customer_id')
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // false once checked out / abandoned

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
