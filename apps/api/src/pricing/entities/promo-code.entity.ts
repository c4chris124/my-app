import {
  BeforeInsert,
  BeforeUpdate,
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
import { PromoApplyScope } from '@myapp/shared';
import { Category } from '../../categories/entities/category.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { PromoCodeRedemption } from '../../redemptions/entities/promo-code-redemption.entity.js';

export type PromoDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

@Entity('promo_codes')
@Index('idx_promo_codes_active_dates', ['isActive', 'validFrom', 'validUntil'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Stored UPPERCASE; matched case-insensitively. Unique.
  @Index('idx_promo_codes_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'],
  })
  discountType: PromoDiscountType;

  // NULL only when discountType = FREE_DELIVERY.
  // decimals come back as strings in the pg driver
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  discountValue: string | null;

  @Column({ type: 'enum', enum: PromoApplyScope })
  applyScope: PromoApplyScope;

  @Index('idx_promo_codes_scope_product')
  @Column({ type: 'uuid', nullable: true })
  scopeProductId: string | null;

  @ManyToOne(() => Product, (p) => p.promoCodes, { nullable: true })
  @JoinColumn({ name: 'scopeProductId' })
  scopeProduct: Product | null;

  @Index('idx_promo_codes_scope_category')
  @Column({ type: 'uuid', nullable: true })
  scopeCategoryId: string | null;

  @ManyToOne(() => Category, (c) => c.promoCodes, { nullable: true })
  @JoinColumn({ name: 'scopeCategoryId' })
  scopeCategory: Category | null;

  @Column({ type: 'int', default: 1 })
  minQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderValue: string | null;

  @Column({ type: 'int', nullable: true })
  maxUsesTotal: number | null; // NULL = unlimited

  @Column({ type: 'int', default: 1 })
  maxUsesPerCustomer: number;

  @Column({ type: 'int', default: 0 })
  currentUses: number; // server-managed; never client-settable

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null; // NULL = no expiry

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PromoCodeRedemption, (r) => r.promoCode)
  redemptions: PromoCodeRedemption[];

  @BeforeInsert()
  @BeforeUpdate()
  toUpperCase() {
    if (this.code) {
      this.code = this.code.toUpperCase();
    }
  }
}
