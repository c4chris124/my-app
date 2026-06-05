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
import { DiscountType, PromoApplyScope } from '@myapp/shared';
import { Category } from '../../categories/entities/category.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { PromoCodeRedemption } from './promo-code-redemption.entity.js';

@Entity('promo_codes')
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_promo_codes_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'enum', enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'] })
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  discountValue: number | null;

  @Column({ type: 'enum', enum: PromoApplyScope })
  applyScope: PromoApplyScope;

  @Index('idx_promo_codes_scope_product')
  @Column({ type: 'uuid', nullable: true })
  scopeProductId: string | null;

  @ManyToOne(() => Product, (p) => p.promoCodes, { nullable: true })
  @JoinColumn({ name: 'scope_product_id' })
  scopeProduct: Product | null;

  @Index('idx_promo_codes_scope_category')
  @Column({ type: 'uuid', nullable: true })
  scopeCategoryId: string | null;

  @ManyToOne(() => Category, (c) => c.promoCodes, { nullable: true })
  @JoinColumn({ name: 'scope_category_id' })
  scopeCategory: Category | null;

  @Column({ type: 'int', default: 1 })
  minQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderValue: number | null;

  @Column({ type: 'int', nullable: true })
  maxUsesTotal: number | null;

  @Column({ type: 'int', default: 1 })
  maxUsesPerCustomer: number;

  @Column({ type: 'int', default: 0 })
  currentUses: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index('idx_promo_codes_active_dates')
  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PromoCodeRedemption, (r) => r.promoCode)
  redemptions: PromoCodeRedemption[];
}
