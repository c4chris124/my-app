import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import { ProductAlternateCode } from '../entities/product-alternate-code.entity.js';
import { CreateProductDto } from '../dtos/create-product.dto.js';
import { ProductsFindRepository } from './products-find.repository.js';
import { BrandsFindRepository } from '../../brands/repository/brands-find.repository.js';
import { SuppliersFindRepository } from '../../suppliers/repository/suppliers-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';
import { UnitsMeasureFindRepository } from '../../units-of-measure/repository/units-mesure-find.repository.js';
import {
  deriveAlternateCodes,
  derivePriceFields,
  isSkuUniqueViolation,
  toDecimalString,
} from './product-write.helpers.js';

@Injectable()
export class ProductsCreateRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly brandsFindRepository: BrandsFindRepository,
    private readonly suppliersFindRepository: SuppliersFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
    private readonly unitsMeasureFindRepository: UnitsMeasureFindRepository,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.validateForeignKeys(createProductDto);

    try {
      return await this.insertWithGeneratedSku(createProductDto);
    } catch (error) {
      // rare race: another create grabbed the same SKU — retry once
      if (isSkuUniqueViolation(error)) {
        return this.insertWithGeneratedSku(createProductDto);
      }
      throw error;
    }
  }

  private async validateForeignKeys(
    createProductDto: CreateProductDto,
  ): Promise<void> {
    await this.ensureReferenceExists(
      () => this.brandsFindRepository.findById(createProductDto.brandId),
      'brandId',
      'brand',
    );
    await this.ensureReferenceExists(
      () => this.suppliersFindRepository.findById(createProductDto.supplierId),
      'supplierId',
      'supplier',
    );
    await this.ensureReferenceExists(
      () => this.categoriesFindRepository.findById(createProductDto.categoryId),
      'categoryId',
      'category',
    );
    if (createProductDto.capacityUnitId) {
      await this.ensureReferenceExists(
        () =>
          this.unitsMeasureFindRepository.findById(
            createProductDto.capacityUnitId as string,
          ),
        'capacityUnitId',
        'unit of measure',
      );
    }
  }

  private async ensureReferenceExists(
    lookup: () => Promise<unknown>,
    fieldName: string,
    entityName: string,
  ): Promise<void> {
    try {
      await lookup();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          `${fieldName} references a non-existent ${entityName}`,
        );
      }
      throw error;
    }
  }

  private async insertWithGeneratedSku(
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const savedProduct = await this.dataSource.transaction(
      async (transactionManager) => {
        const productRepository = transactionManager.getRepository(Product);
        const alternateCodeRepository =
          transactionManager.getRepository(ProductAlternateCode);

        const nextSkuCounter =
          (await this.productsFindRepository.findMaxSkuCounter()) + 1;
        const generatedSku = `RHB-${String(nextSkuCounter).padStart(5, '0')}`;

        const {
          alternateCodes: explicitAlternateCodes,
          distributorPrice,
          salePrice,
          capacityValue,
          ...directFields
        } = createProductDto;

        const derivedPriceFields = derivePriceFields(
          distributorPrice ?? null,
          salePrice ?? null,
        );

        const alternateCodeEntities = deriveAlternateCodes(
          createProductDto.brandCode,
          explicitAlternateCodes ?? [],
        ).map((alternateCode) =>
          alternateCodeRepository.create({ code: alternateCode }),
        );

        const newProduct = productRepository.create({
          ...directFields,
          sku: generatedSku,
          capacityValue: toDecimalString(capacityValue ?? null),
          ...derivedPriceFields,
          alternateCodes: alternateCodeEntities,
        });

        return productRepository.save(newProduct);
      },
    );

    return this.productsFindRepository.findById(savedProduct.id);
  }
}
