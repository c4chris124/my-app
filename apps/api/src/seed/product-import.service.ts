import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { Product } from '../products/entities/product.entity.js';
import { ProductAlternateCode } from '../products/entities/product-alternate-code.entity.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { UnitOfMeasure } from '../units-of-measure/entities/unit-of-measure.entity.js';
import { parseGTQPrice } from '../common/utils/price-parser.util.js';
import { toSlug } from '../common/utils/slug.util.js';
import { SalesWeighting } from '@myapp/shared';

const CAPACITY_REGEX =
  /(\d+\.?\d*)\s*(LIBRAS?|LTS?|LITROS?|KG|KILOGRAMOS?|UNIDADES?|ML|CM|MTS?|PULGADAS?|ONZAS?|LB)/i;
const BRAND_REGEX = /MARCA\s+([A-Z][A-Z0-9\s]+?)(?=\s+DE|\s+CON|\s+PARA|$)/i;
const WEIGHTING_MAP: Record<string, SalesWeighting> = {
  'MUY ALTO': SalesWeighting.MUY_ALTO,
  ALTO: SalesWeighting.ALTO,
  MEDIO: SalesWeighting.MEDIO,
  BAJO: SalesWeighting.BAJO,
};

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);
  private skuCounter = 1;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductAlternateCode)
    private readonly altCodeRepo: Repository<ProductAlternateCode>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,
  ) {}

  async importFromCsv(filePath: string): Promise<void> {
    const records = await this.parseCsv(filePath);
    this.logger.log(`Parsed ${records.length} rows from CSV`);

    for (const row of records) {
      try {
        await this.importRow(row);
      } catch (err) {
        this.logger.error(`Failed to import row: ${JSON.stringify(row)}`, err);
      }
    }
    this.logger.log('CSV import complete');
  }

  private parseCsv(filePath: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const records: Record<string, string>[] = [];
      fs.createReadStream(filePath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            from_line: 2, // row 0 is blank metadata, row 1 is headers
            trim: true,
          }),
        )
        .on('data', (row: Record<string, string>) => records.push(row))
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  private generateSku(): string {
    return `RHB-${String(this.skuCounter++).padStart(5, '0')}`;
  }

  private async importRow(row: Record<string, string>): Promise<void> {
    // Strip decorative prefixes from name
    const rawName = (row['Nombre'] ?? row['name'] ?? '')
      .replace(/✨/g, '')
      .trim();
    if (!rawName) return;

    // Extract brand from name or dedicated column
    const brandName = this.extractBrand(
      rawName,
      row['Marca'] ?? row['brand'] ?? '',
    );
    const brand = await this.findOrCreateBrand(brandName);

    // Category
    const categoryName =
      row['Categoría'] ?? row['category'] ?? 'Otras Máquinas';
    const category = await this.findOrCreateCategory(categoryName);

    // Supplier
    const supplierName = row['Proveedor'] ?? row['supplier'] ?? 'TECNOPAN';
    const supplier = await this.supplierRepo.findOne({
      where: { name: supplierName },
    });
    if (!supplier) return;

    // Prices
    const distributorPrice = parseGTQPrice(
      row['Precio Distribuidor'] ?? row['cost'] ?? '',
    );
    const salePrice = parseGTQPrice(row['Precio Venta'] ?? row['price'] ?? '');
    const pricePending = distributorPrice === null && salePrice === null;

    // Margin
    const marginRaw = (row['Margen'] ?? row['margin'] ?? '')
      .replace('%', '')
      .trim();
    const marginPercent = marginRaw ? parseFloat(marginRaw) : null;

    // Capacity
    const { value: capacityValue, unit: capacityUnit } =
      this.extractCapacity(rawName);
    const unitEntity = capacityUnit
      ? await this.unitRepo.findOne({
          where: { name: capacityUnit.toUpperCase() },
        })
      : null;

    // Sales weighting
    const weightingRaw = (row['Rotación'] ?? row['weighting'] ?? '')
      .toUpperCase()
      .trim();
    const salesWeighting = WEIGHTING_MAP[weightingRaw] ?? null;

    // Brand code
    const rawCode = (row['Código'] ?? row['code'] ?? '').trim();
    const primaryCode = rawCode || `TBD-${this.skuCounter}`;
    const alternateCodes = rawCode.includes(' / ')
      ? rawCode.split(' / ').map((c) => c.trim())
      : [primaryCode];

    const sku = this.generateSku();

    const product = this.productRepo.create({
      sku,
      brandCode: alternateCodes[0],
      name: rawName,
      brandId: brand.id,
      supplierId: supplier.id,
      categoryId: category.id,
      distributorPrice,
      salePrice,
      revenue:
        salePrice !== null && distributorPrice !== null
          ? salePrice - distributorPrice
          : null,
      marginPercent: isNaN(marginPercent!) ? null : marginPercent,
      salesWeighting,
      pricePending,
      capacityValue,
      capacityUnitId: unitEntity?.id ?? null,
    });

    const saved = await this.productRepo.save(product);

    // Store all alternate codes
    for (const code of alternateCodes) {
      const ac = this.altCodeRepo.create({ productId: saved.id, code });
      await this.altCodeRepo.save(ac).catch(() => {}); // ignore dup constraint
    }
  }

  private extractBrand(name: string, brandColumn: string): string {
    if (brandColumn) return brandColumn.trim().toUpperCase();
    const match = BRAND_REGEX.exec(name);
    return match ? match[1].trim().toUpperCase() : 'UNKNOWN';
  }

  private extractCapacity(name: string): {
    value: number | null;
    unit: string | null;
  } {
    const match = CAPACITY_REGEX.exec(name);
    if (!match) return { value: null, unit: null };
    return { value: parseFloat(match[1]), unit: match[2].toUpperCase() };
  }

  private async findOrCreateBrand(name: string): Promise<Brand> {
    let brand = await this.brandRepo.findOne({ where: { name } });
    if (!brand) {
      brand = await this.brandRepo.save(
        this.brandRepo.create({ name, slug: toSlug(name) }),
      );
    }
    return brand;
  }

  private async findOrCreateCategory(name: string): Promise<Category> {
    let cat = await this.categoryRepo.findOne({ where: { name } });
    if (!cat) {
      cat = await this.categoryRepo.save(
        this.categoryRepo.create({ name, slug: toSlug(name), parentId: null }),
      );
    }
    return cat;
  }
}
