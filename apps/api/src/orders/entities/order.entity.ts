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
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';
import { User } from '../../users/entities/user.entity.js';
import { PromoCode } from '../../pricing/entities/promo-code.entity.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusHistory } from './order-status-history.entity.js';

// Immutable record created at checkout. Totals and items never change after
// creation — only the two status columns move, each through its own state
// machine (order-status.helpers.ts), with every change audited in
// order_status_history.
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 'ORD-2041', auto-generated, immutable.
  @Index('idx_orders_order_number', { unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  orderNumber: string;

  @Index('idx_orders_customer_id')
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  // Business name at time of order, so the list renders correctly even if
  // the customer is later renamed.
  @Column({ type: 'varchar', length: 255 })
  customerNameSnapshot: string;

  @Index('idx_orders_fulfillment_status')
  @Column({
    type: 'enum',
    enum: FulfillmentStatus,
    default: FulfillmentStatus.PENDING,
  })
  fulfillmentStatus: FulfillmentStatus;

  @Index('idx_orders_payment_status')
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  // decimals come back as strings in the pg driver
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: string;

  // Filled by the Redemptions/pricing seam in checkout.
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountTotal: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: string;

  @Column({ type: 'varchar', length: 3, default: 'GTQ' })
  currency: string;

  // Denormalized sum of line quantities for the list view.
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  // Set by the Redemptions module later; always null for now.
  @Column({ type: 'uuid', nullable: true })
  appliedPromoCodeId: string | null;

  @ManyToOne(() => PromoCode, { nullable: true, eager: false })
  @JoinColumn({ name: 'appliedPromoCodeId' })
  appliedPromoCode: PromoCode | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index('idx_orders_placed_at')
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  placedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (entry) => entry.order, {
    cascade: true,
  })
  statusHistory: OrderStatusHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
