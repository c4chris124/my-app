import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingSchema1700000001000 implements MigrationInterface {
  name = 'CreatePricingSchema1700000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."price_rules_rule_type_enum" AS ENUM('TRADE_TIER','VOLUME','CLEARANCE','CUSTOM')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."price_rules_scope_enum" AS ENUM('ALL_PRODUCTS','CATEGORY','BRAND','PRODUCT')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."price_rules_discount_type_enum" AS ENUM('PERCENTAGE','FIXED_AMOUNT')
    `);

    await queryRunner.query(`
      CREATE TABLE "price_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "description" text,
        "rule_type" "public"."price_rules_rule_type_enum" NOT NULL,
        "scope" "public"."price_rules_scope_enum" NOT NULL,
        "scope_category_id" uuid,
        "scope_brand_id" uuid,
        "scope_product_id" uuid,
        "discount_type" "public"."price_rules_discount_type_enum" NOT NULL DEFAULT 'PERCENTAGE',
        "discount_value" decimal(8,2) NOT NULL,
        "min_quantity" int NOT NULL DEFAULT 1,
        "min_order_value" decimal(12,2),
        "priority" int NOT NULL DEFAULT 0,
        "is_stackable" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "valid_from" TIMESTAMP WITH TIME ZONE,
        "valid_until" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_price_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_price_rules_category" FOREIGN KEY ("scope_category_id") REFERENCES "categories"("id"),
        CONSTRAINT "FK_price_rules_brand" FOREIGN KEY ("scope_brand_id") REFERENCES "brands"("id"),
        CONSTRAINT "FK_price_rules_product" FOREIGN KEY ("scope_product_id") REFERENCES "products"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_price_rules_scope_type" ON "price_rules" ("scope", "rule_type", "is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_price_rules_category" ON "price_rules" ("scope_category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_price_rules_brand" ON "price_rules" ("scope_brand_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_price_rules_product" ON "price_rules" ("scope_product_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."promo_codes_discount_type_enum" AS ENUM('PERCENTAGE','FIXED_AMOUNT','FREE_DELIVERY')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."promo_codes_apply_scope_enum" AS ENUM('CART','PRODUCT','CATEGORY')
    `);

    await queryRunner.query(`
      CREATE TABLE "promo_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(50) NOT NULL,
        "description" varchar(500) NOT NULL,
        "discount_type" "public"."promo_codes_discount_type_enum" NOT NULL,
        "discount_value" decimal(8,2),
        "apply_scope" "public"."promo_codes_apply_scope_enum" NOT NULL,
        "scope_product_id" uuid,
        "scope_category_id" uuid,
        "min_quantity" int NOT NULL DEFAULT 1,
        "min_order_value" decimal(12,2),
        "max_uses_total" int,
        "max_uses_per_customer" int NOT NULL DEFAULT 1,
        "current_uses" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "valid_from" TIMESTAMP WITH TIME ZONE,
        "valid_until" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_promo_codes_code" UNIQUE ("code"),
        CONSTRAINT "PK_promo_codes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promo_codes_product" FOREIGN KEY ("scope_product_id") REFERENCES "products"("id"),
        CONSTRAINT "FK_promo_codes_category" FOREIGN KEY ("scope_category_id") REFERENCES "categories"("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_promo_codes_code" ON "promo_codes" (UPPER("code"))
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_promo_codes_active_dates" ON "promo_codes" ("is_active", "valid_from", "valid_until")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_promo_codes_scope_product" ON "promo_codes" ("scope_product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_promo_codes_scope_category" ON "promo_codes" ("scope_category_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "promo_code_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "promo_code_id" uuid NOT NULL,
        "order_id" uuid,
        "customer_id" uuid,
        "applied_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "discount_amount" decimal(12,2) NOT NULL,
        "is_free_delivery" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_promo_code_redemptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promo_code_redemptions_promo" FOREIGN KEY ("promo_code_id")
          REFERENCES "promo_codes"("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_code_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_codes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."promo_codes_apply_scope_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."promo_codes_discount_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "price_rules"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."price_rules_discount_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."price_rules_scope_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."price_rules_rule_type_enum"`);
  }
}
