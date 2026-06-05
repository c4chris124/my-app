import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPricingData1700000003000 implements MigrationInterface {
  name = 'SeedPricingData1700000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Price rules
    const rules = [
      {
        name: 'Trade Tier',
        ruleType: 'TRADE_TIER',
        scope: 'ALL_PRODUCTS',
        discountType: 'PERCENTAGE',
        discountValue: 8,
        minQuantity: 1,
        priority: 10,
      },
      {
        name: 'Volume 10+',
        ruleType: 'VOLUME',
        scope: 'ALL_PRODUCTS',
        discountType: 'PERCENTAGE',
        discountValue: 12,
        minQuantity: 10,
        priority: 20,
      },
      {
        name: 'Clearance',
        ruleType: 'CLEARANCE',
        scope: 'ALL_PRODUCTS',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minQuantity: 1,
        priority: 5,
      },
    ];

    for (const r of rules) {
      await queryRunner.query(`
        INSERT INTO price_rules
          (name, rule_type, scope, discount_type, discount_value, min_quantity, priority,
           is_stackable, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, false, true)
        ON CONFLICT DO NOTHING
      `, [r.name, r.ruleType, r.scope, r.discountType, r.discountValue, r.minQuantity, r.priority]);
    }

    // Promo codes
    const promos = [
      {
        code: 'SPRING26',
        description: 'Spring fit-out campaign',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        applyScope: 'CART',
        minQuantity: 1,
        isActive: true,
      },
      {
        code: 'BUNDLE5',
        description: 'Buy 5 prep units',
        discountType: 'FREE_DELIVERY',
        discountValue: null,
        applyScope: 'PRODUCT',
        minQuantity: 5,
        isActive: true,
      },
      {
        code: 'WINTER25',
        description: 'Winter clearance (expired)',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        applyScope: 'CART',
        minQuantity: 1,
        isActive: false,
      },
    ];

    for (const p of promos) {
      await queryRunner.query(`
        INSERT INTO promo_codes
          (code, description, discount_type, discount_value, apply_scope,
           min_quantity, max_uses_per_customer, current_uses, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, 1, 0, $7)
        ON CONFLICT (code) DO NOTHING
      `, [
        p.code,
        p.description,
        p.discountType,
        p.discountValue,
        p.applyScope,
        p.minQuantity,
        p.isActive,
      ]);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM promo_codes WHERE code IN ('SPRING26','BUNDLE5','WINTER25')`);
    await queryRunner.query(`DELETE FROM price_rules WHERE name IN ('Trade Tier','Volume 10+','Clearance')`);
  }
}
