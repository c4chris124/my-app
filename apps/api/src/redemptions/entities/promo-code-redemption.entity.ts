import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PromoCode } from '../../pricing/entities/promo-code.entity.js';
import { Order } from '../../orders/entities/order.entity.js';
import { User } from '../../users/entities/user.entity.js';

// Append-only financial audit log: one row per promo applied at checkout.
// Never updated, never deleted — there are intentionally no update/delete
// repositories for this entity.
@Entity('promo_code_redemptions')
@Index('idx_redemptions_promo', ['promoCodeId'])
@Index('idx_redemptions_promo_customer', ['promoCodeId', 'customerId'])
@Index('idx_redemptions_order', ['orderId'])
export class PromoCodeRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promoCodeId: string;

  @ManyToOne(() => PromoCode, (promoCode) => promoCode.redemptions, {
    nullable: false,
  })
  @JoinColumn({ name: 'promoCodeId' })
  promoCode: PromoCode;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  // User.id (role CUSTOMER); null for guest checkouts.
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: User | null;

  // GTQ saved by this redemption.
  // decimals come back as strings in the pg driver
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discountAmount: string;

  @Column({ type: 'boolean', default: false })
  isFreeDelivery: boolean;

  @CreateDateColumn()
  appliedAt: Date;
}
