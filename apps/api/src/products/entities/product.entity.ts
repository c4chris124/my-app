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
import { SalesWeighting } from '@myapp/shared';
import { Brand } from '../../brands/entities/brand.entity.js';
import { Supplier } from '../../suppliers/entities/supplier.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { UnitOfMeasure } from '../../units-of-measure/entities/unit-of-measure.entity.js';
import { ProductAlternateCode } from './product-alternate-code.entity.js';
import { PriceRule } from '../../pricing/entities/price-rule.entity.js';
import { PromoCode } from '../../pricing/entities/promo-code.entity.js';

@Entity('products')
@Index('idx_products_price_range', ['salePrice', 'isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_products_sku', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Index('idx_products_brand_code')
  @Column({ type: 'varchar', length: 150 })
  brandCode: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'tsvector', nullable: true, select: false })
  nameNormalized: any;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  capacityValue: number | null;

  @Column({ type: 'uuid', nullable: true })
  capacityUnitId: string | null;

  @ManyToOne(() => UnitOfMeasure, (u) => u.products, { nullable: true, eager: false })
  @JoinColumn({ name: 'capacity_unit_id' })
  capacityUnit: UnitOfMeasure | null;

  @Index('idx_products_brand_id')
  @Column({ type: 'uuid' })
  brandId: string;

  @ManyToOne(() => Brand, (b) => b.products, { eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Index('idx_products_supplier_id')
  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, (s) => s.products, { eager: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Index('idx_products_category_id')
  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (c) => c.products, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  distributorPrice: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salePrice: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  revenue: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  marginPercent: number | null;

  @Column({
    type: 'enum',
    enum: SalesWeighting,
    nullable: true,
  })
  salesWeighting: SalesWeighting | null;

  @Column({ type: 'boolean', default: false })
  pricePending: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', array: true, default: '{}' })
  imageUrls: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  metaDescription: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductAlternateCode, (c) => c.product, { cascade: true })
  alternateCodes: ProductAlternateCode[];

  @OneToMany(() => PriceRule, (r) => r.scopeProduct)
  priceRules: PriceRule[];

  @OneToMany(() => PromoCode, (pc) => pc.scopeProduct)
  promoCodes: PromoCode[];
}
