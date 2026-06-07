import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCatalogSchema1700000000000 implements MigrationInterface {
  name = 'CreateProductCatalogSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."units_of_measure_type_enum"
        AS ENUM('weight', 'volume', 'count', 'length')
    `);

    await queryRunner.query(`
      CREATE TABLE "units_of_measure" (
        "id"           uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "name"         varchar(50)  NOT NULL,
        "abbreviation" varchar(20)  NOT NULL,
        "type"         "public"."units_of_measure_type_enum" NOT NULL,
        CONSTRAINT "UQ_units_of_measure_name" UNIQUE ("name"),
        CONSTRAINT "PK_units_of_measure" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "brands" (
        "id"          uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "name"        varchar(100)  NOT NULL,
        "slug"        varchar(120)  NOT NULL,
        "description" text,
        "is_active"   boolean       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_brands_name" UNIQUE ("name"),
        CONSTRAINT "UQ_brands_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_brands" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id"            uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "name"          varchar(100)  NOT NULL,
        "slug"          varchar(120)  NOT NULL,
        "contact_email" varchar(255),
        "contact_phone" varchar(50),
        "country"       varchar(100)  NOT NULL DEFAULT 'Guatemala',
        "is_active"     boolean       NOT NULL DEFAULT true,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_suppliers_name" UNIQUE ("name"),
        CONSTRAINT "UQ_suppliers_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"          uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "name"        varchar(150)  NOT NULL,
        "slug"        varchar(170)  NOT NULL,
        "description" text,
        "image_url"   varchar(500),
        "parent_id"   uuid,
        "sort_order"  int           NOT NULL DEFAULT 0,
        "is_active"   boolean       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_parent"
          FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."products_sales_weighting_enum"
        AS ENUM('MUY_ALTO', 'ALTO', 'MEDIO', 'BAJO')
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "sku"              varchar(100)  NOT NULL,
        "brand_code"       varchar(150)  NOT NULL,
        "name"             varchar(500)  NOT NULL,
        "name_normalized"  tsvector,
        "description"      text,
        "capacity_value"   decimal(10,2),
        "capacity_unit_id" uuid,
        "brand_id"         uuid          NOT NULL,
        "supplier_id"      uuid          NOT NULL,
        "category_id"      uuid          NOT NULL,
        "distributor_price" decimal(12,2),
        "sale_price"       decimal(12,2),
        "revenue"          decimal(12,2),
        "margin_percent"   decimal(5,2),
        "sales_weighting"  "public"."products_sales_weighting_enum",
        "price_pending"    boolean       NOT NULL DEFAULT false,
        "is_featured"      boolean       NOT NULL DEFAULT false,
        "is_active"        boolean       NOT NULL DEFAULT true,
        "sort_order"       int           NOT NULL DEFAULT 0,
        "image_urls"       text[]        NOT NULL DEFAULT '{}',
        "tags"             text[]        NOT NULL DEFAULT '{}',
        "meta_title"       varchar(255),
        "meta_description" varchar(500),
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku"  UNIQUE ("sku"),
        CONSTRAINT "PK_products"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_brand"
          FOREIGN KEY ("brand_id")    REFERENCES "brands"("id"),
        CONSTRAINT "FK_products_supplier"
          FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id"),
        CONSTRAINT "FK_products_unit"
          FOREIGN KEY ("capacity_unit_id") REFERENCES "units_of_measure"("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_products_brand_id"    ON "products" ("brand_id")`);
    await queryRunner.query(`CREATE INDEX "idx_products_category_id" ON "products" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "idx_products_supplier_id" ON "products" ("supplier_id")`);
    await queryRunner.query(`CREATE INDEX "idx_products_brand_code"  ON "products" ("brand_code")`);
    await queryRunner.query(`CREATE INDEX "idx_products_fts"         ON "products" USING GIN ("name_normalized")`);
    await queryRunner.query(`CREATE INDEX "idx_products_price_range" ON "products" ("sale_price", "is_active")`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_product_name_normalized()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.name_normalized := to_tsvector('spanish', NEW.name);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_products_name_normalized
      BEFORE INSERT OR UPDATE OF name ON products
      FOR EACH ROW EXECUTE FUNCTION update_product_name_normalized()
    `);

    await queryRunner.query(`
      CREATE TABLE "product_alternate_codes" (
        "id"         uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid          NOT NULL,
        "code"       varchar(100)  NOT NULL,
        CONSTRAINT "UQ_product_alternate_codes" UNIQUE ("product_id", "code"),
        CONSTRAINT "PK_product_alternate_codes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_alternate_codes_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_product_alternate_codes_code" ON "product_alternate_codes" ("code")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_products_name_normalized ON products`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_product_name_normalized`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_alternate_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."products_sales_weighting_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "units_of_measure"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."units_of_measure_type_enum"`);
  }
}
