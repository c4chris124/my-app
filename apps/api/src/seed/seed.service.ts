import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasure } from '../units-of-measure/entities/unit-of-measure.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { PriceRule } from '../pricing/entities/price-rule.entity.js';
import { PromoCode } from '../pricing/entities/promo-code.entity.js';
import { toSlug } from '../common/utils/slug.util.js';
import { PriceRuleScope, PriceRuleType, PromoApplyScope } from '@myapp/shared';

const UNITS: Array<{
  name: string;
  abbreviation: string;
  type: UnitOfMeasure['type'];
}> = [
  { name: 'LIBRAS', abbreviation: 'lbs', type: 'weight' },
  { name: 'KG', abbreviation: 'kg', type: 'weight' },
  { name: 'ONZAS', abbreviation: 'oz', type: 'weight' },
  { name: 'LITROS', abbreviation: 'L', type: 'volume' },
  { name: 'ML', abbreviation: 'ml', type: 'volume' },
  { name: 'UNIDADES', abbreviation: 'u', type: 'count' },
  { name: 'PULGADAS', abbreviation: 'in', type: 'length' },
  { name: 'CM', abbreviation: 'cm', type: 'length' },
  { name: 'MTS', abbreviation: 'm', type: 'length' },
];

const TOP_LEVEL_CATEGORIES = [
  'Amasadoras',
  'Batidoras',
  'Vitrinas Refrigeradas',
  'Laminadoras',
  'Hornos',
  'Máquinas para Paninis',
  'Máquinas para Granizadas',
  'Chafing / Mantenedores',
  'Licuadoras',
  'Termos y Cafeteras',
  'Molinos',
  'Trompos para Tacos',
  'Máquinas de Helados',
  'Planchas Eléctricas',
  'Embutidoras',
  'Selladoras',
  'Máquinas para Churros',
  'Freidoras',
  'Refrigeradores y Congeladores',
  'Mesas de Trabajo',
  'Estufas e Inducción',
  'Parrillas',
  'Café Especialidad',
  'Mobiliario',
  'Equipos de Limpieza',
  'Otras Máquinas',
];

const CRM_SUBCATEGORIES: Array<{ name: string; parentName: string }> = [
  { name: 'Ranges & Cooktops', parentName: 'Estufas e Inducción' },
  { name: 'Ovens', parentName: 'Hornos' },
  { name: 'Reach-In Units', parentName: 'Refrigeradores y Congeladores' },
  { name: 'Mixers', parentName: 'Batidoras' },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(PriceRule)
    private readonly ruleRepo: Repository<PriceRule>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
  ) {}

  async seed(): Promise<void> {
    await this.seedUnits();
    await this.seedCategories();
    await this.seedSuppliers();
    await this.seedPriceRules();
    await this.seedPromoCodes();
    this.logger.log('Seed complete');
  }

  private async seedUnits(): Promise<void> {
    for (const u of UNITS) {
      const exists = await this.unitRepo.findOne({ where: { name: u.name } });
      if (!exists) {
        await this.unitRepo.save(this.unitRepo.create(u));
      }
    }
    this.logger.log(`Units of measure seeded`);
  }

  private async seedCategories(): Promise<void> {
    const topMap: Record<string, Category> = {};

    for (const name of TOP_LEVEL_CATEGORIES) {
      let cat = await this.categoryRepo.findOne({ where: { name } });
      if (!cat) {
        cat = await this.categoryRepo.save(
          this.categoryRepo.create({
            name,
            slug: toSlug(name),
            parentId: null,
          }),
        );
      }
      topMap[name] = cat;
    }

    for (const sub of CRM_SUBCATEGORIES) {
      const parent = topMap[sub.parentName];
      if (!parent) continue;
      const exists = await this.categoryRepo.findOne({
        where: { name: sub.name },
      });
      if (!exists) {
        await this.categoryRepo.save(
          this.categoryRepo.create({
            name: sub.name,
            slug: toSlug(sub.name),
            parentId: parent.id,
          }),
        );
      }
    }
    this.logger.log(`Categories seeded`);
  }

  private async seedSuppliers(): Promise<void> {
    const exists = await this.supplierRepo.findOne({
      where: { name: 'TECNOPAN' },
    });
    if (!exists) {
      await this.supplierRepo.save(
        this.supplierRepo.create({ name: 'TECNOPAN', slug: 'tecnopan' }),
      );
    }
    this.logger.log(`Suppliers seeded`);
  }

  private async seedPriceRules(): Promise<void> {
    const rules: Array<Partial<PriceRule>> = [
      {
        name: 'Trade Tier',
        ruleType: PriceRuleType.TRADE_TIER,
        scope: PriceRuleScope.ALL_PRODUCTS,
        discountType: 'PERCENTAGE',
        discountValue: '8.00',
        minQuantity: 1,
        priority: 10,
        isStackable: false,
        isActive: true,
      },
      {
        name: 'Volume 10+',
        ruleType: PriceRuleType.VOLUME,
        scope: PriceRuleScope.ALL_PRODUCTS,
        discountType: 'PERCENTAGE',
        discountValue: '12.00',
        minQuantity: 10,
        priority: 20,
        isStackable: false,
        isActive: true,
      },
      {
        name: 'Clearance',
        ruleType: PriceRuleType.CLEARANCE,
        scope: PriceRuleScope.ALL_PRODUCTS,
        discountType: 'PERCENTAGE',
        discountValue: '25.00',
        minQuantity: 1,
        priority: 5,
        isStackable: false,
        isActive: true,
      },
    ];

    for (const r of rules) {
      const exists = await this.ruleRepo.findOne({ where: { name: r.name } });
      if (!exists) {
        await this.ruleRepo.save(this.ruleRepo.create(r));
      }
    }
    this.logger.log(`Price rules seeded`);
  }

  private async seedPromoCodes(): Promise<void> {
    const codes: Array<Partial<PromoCode>> = [
      {
        code: 'SPRING26',
        description: 'Spring fit-out campaign',
        discountType: 'PERCENTAGE',
        discountValue: '10.00',
        applyScope: PromoApplyScope.CART,
        minQuantity: 1,
        maxUsesPerCustomer: 1,
        isActive: true,
      },
      {
        code: 'BUNDLE5',
        description: 'Buy 5 prep units',
        discountType: 'FREE_DELIVERY',
        discountValue: null,
        applyScope: PromoApplyScope.PRODUCT,
        scopeProductId: null,
        minQuantity: 5,
        maxUsesPerCustomer: 1,
        isActive: true,
      },
      {
        code: 'WINTER25',
        description: 'Winter clearance (expired)',
        discountType: 'PERCENTAGE',
        discountValue: '20.00',
        applyScope: PromoApplyScope.CART,
        minQuantity: 1,
        maxUsesPerCustomer: 1,
        isActive: false,
      },
    ];

    for (const c of codes) {
      const exists = await this.promoRepo.findOne({ where: { code: c.code } });
      if (!exists) {
        await this.promoRepo.save(this.promoRepo.create(c));
      }
    }
    this.logger.log(`Promo codes seeded`);
  }
}
