import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import { UnitOfMeasure } from '../../units-of-measure/entities/unit-of-measure.entity.js';
import { PriceRule } from '../../pricing/entities/price-rule.entity.js';
import { PromoCode } from '../../pricing/entities/promo-code.entity.js';
import type { CatalogListResponse } from '@myapp/shared';

@Injectable()
export class CatalogsFindRepository {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(PriceRule)
    private readonly priceRuleRepo: Repository<PriceRule>,
    @InjectRepository(PromoCode)
    private readonly promoCodeRepo: Repository<PromoCode>,
  ) {}

  async findAll(): Promise<CatalogListResponse> {
    const [units, categories, subcategories, prices, promotions] =
      await Promise.all([
        this.unitRepo.count({ where: { isActive: true } }),
        this.categoryRepo.count({ where: { isActive: true, parentId: IsNull() } }),
        this.categoryRepo.count({ where: { isActive: true, parentId: Not(IsNull()) } }),
        this.priceRuleRepo.count({ where: { isActive: true } }),
        this.promoCodeRepo.count({ where: { isActive: true } }),
      ]);

    const data = [
      { id: 'units-of-measure', name: 'Units of Measure', itemCount: units },
      { id: 'categories',       name: 'Categories',       itemCount: categories },
      { id: 'subcategories',    name: 'Subcategories',    itemCount: subcategories },
      { id: 'prices',           name: 'Price Rules',      itemCount: prices },
      { id: 'promotions',       name: 'Promotions',       itemCount: promotions },
    ];

    return { data, total: data.length };
  }
}
