import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';

@Entity('units_of_measure')
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  abbreviation: string;

  @Column({ type: 'enum', enum: ['weight', 'volume', 'count', 'length'] })
  type: 'weight' | 'volume' | 'count' | 'length';

  @OneToMany(() => Product, (p) => p.capacityUnit)
  products: Product[];
}
