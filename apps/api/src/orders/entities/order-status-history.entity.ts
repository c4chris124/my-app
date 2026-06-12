import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatusKind } from '@myapp/shared';
import { User } from '../../users/entities/user.entity.js';
import { Order } from './order.entity.js';

// Audit log of every status change; powers the forward/rollback timeline.
@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_order_status_history_order_id')
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: OrderStatusKind })
  statusKind: OrderStatusKind;

  // Null on the initial entry written at checkout.
  @Column({ type: 'varchar', length: 30, nullable: true })
  fromStatus: string | null;

  @Column({ type: 'varchar', length: 30 })
  toStatus: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  // Staff User who made the change; null for system-initiated entries.
  @Column({ type: 'uuid', nullable: true })
  changedById: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  changedAt: Date;
}
