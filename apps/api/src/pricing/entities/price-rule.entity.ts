import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceRuleType, PriceRuleScope } from '@myapp/shared';
import { Category } from '../../categories/entities/category.entity.js';
import { Brand } from '../../brands/entities/brand.entity.js';
import { Product } from '../../products/entities/product.entity.js';

export type RuleDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

@Entity('price_rules')
@Index('idx_price_rules_scope_type', ['scope', 'ruleType', 'isActive'])
export class PriceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: PriceRuleType })
  ruleType: PriceRuleType;

  @Column({ type: 'enum', enum: PriceRuleScope })
  scope: PriceRuleScope;

  @Index('idx_price_rules_category')
  @Column({ type: 'uuid', nullable: true })
  scopeCategoryId: string | null;

  @ManyToOne(() => Category, (c) => c.priceRules, { nullable: true })
  @JoinColumn({ name: 'scopeCategoryId' })
  scopeCategory: Category | null;

  @Index('idx_price_rules_brand')
  @Column({ type: 'uuid', nullable: true })
  scopeBrandId: string | null;

  @ManyToOne(() => Brand, (b) => b.priceRules, { nullable: true })
  @JoinColumn({ name: 'scopeBrandId' })
  scopeBrand: Brand | null;

  @Index('idx_price_rules_product')
  @Column({ type: 'uuid', nullable: true })
  scopeProductId: string | null;

  @ManyToOne(() => Product, (p) => p.priceRules, { nullable: true })
  @JoinColumn({ name: 'scopeProductId' })
  scopeProduct: Product | null;

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    default: 'PERCENTAGE',
  })
  discountType: RuleDiscountType;

  // NOT NULL — every rule has a value.
  // decimals come back as strings in the pg driver
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  discountValue: string;

  @Column({ type: 'int', default: 1 })
  minQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderValue: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number; // higher evaluated first; resolves ordering

  @Column({ type: 'boolean', default: false })
  isStackable: boolean; // can combine with promo codes / other rules

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
