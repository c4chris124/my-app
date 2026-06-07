import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PromoCode } from './promo-code.entity.js';

@Entity('promo_code_redemptions')
export class PromoCodeRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promoCodeId: string;

  @ManyToOne(() => PromoCode, (pc) => pc.redemptions)
  @JoinColumn({ name: 'promo_code_id' })
  promoCode: PromoCode;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  appliedAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discountAmount: number;

  @Column({ type: 'boolean', default: false })
  isFreeDelivery: boolean;
}
