import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity.js';

@Entity('product_alternate_codes')
@Unique('uq_product_alt_code', ['productId', 'code'])
export class ProductAlternateCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (p) => p.alternateCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  code: string;
}
