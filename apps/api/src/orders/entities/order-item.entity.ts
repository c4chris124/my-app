import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { Order } from './order.entity.js';

// All prices here are SNAPSHOTS frozen at checkout — never recomputed,
// regardless of later product price changes.
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_order_items_order_id')
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  // Nullable + SET NULL keeps the order's history if the product is deleted.
  @Index('idx_order_items_product_id')
  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'varchar', length: 100 })
  skuSnapshot: string;

  @Column({ type: 'varchar', length: 500 })
  nameSnapshot: string;

  // product.salePrice frozen at checkout.
  // decimals come back as strings in the pg driver
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: string;

  @Column({ type: 'int' })
  quantity: number;

  // Per-line discount; set by the Redemptions module for product-scoped promos.
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: string;

  // unitPrice * quantity - discountAmount
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  lineTotal: string;
}
