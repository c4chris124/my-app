import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import { ProductAlternateCode } from '../entities/product-alternate-code.entity.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import { ProductsFindRepository } from './products-find.repository.js';
import { BrandsFindRepository } from '../../brands/repository/brands-find.repository.js';
import { SuppliersFindRepository } from '../../suppliers/repository/suppliers-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';
import { UnitsMeasureFindRepository } from '../../units-of-measure/repository/units-mesure-find.repository.js';
import {
  deriveAlternateCodes,
  derivePriceFields,
  toDecimalString,
} from './product-write.helpers.js';

@Injectable()
export class ProductsUpdateRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAlternateCode)
    private readonly alternateCodeRepository: Repository<ProductAlternateCode>,
    private readonly dataSource: DataSource,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly brandsFindRepository: BrandsFindRepository,
    private readonly suppliersFindRepository: SuppliersFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
    private readonly unitsMeasureFindRepository: UnitsMeasureFindRepository,
  ) {}

  async update(
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const existingProduct =
      await this.productsFindRepository.findById(productId);

    await this.validateProvidedForeignKeys(updateProductDto);

    const {
      alternateCodes: explicitAlternateCodes,
      distributorPrice,
      salePrice,
      capacityValue,
      ...directFields
    } = updateProductDto;

    const updatePayload: Partial<Product> & { id: string } = {
      id: productId,
      ...directFields,
    };

    if (capacityValue !== undefined) {
      updatePayload.capacityValue = toDecimalString(capacityValue ?? null);
    }

    if (distributorPrice !== undefined || salePrice !== undefined) {
      const effectiveDistributorPrice =
        distributorPrice !== undefined
          ? distributorPrice
          : existingProduct.distributorPrice === null
            ? null
            : Number(existingProduct.distributorPrice);
      const effectiveSalePrice =
        salePrice !== undefined
          ? salePrice
          : existingProduct.salePrice === null
            ? null
            : Number(existingProduct.salePrice);
      Object.assign(
        updatePayload,
        derivePriceFields(effectiveDistributorPrice, effectiveSalePrice),
      );
    }

    const brandCodeChanged =
      directFields.brandCode !== undefined &&
      directFields.brandCode !== existingProduct.brandCode;
    const shouldReplaceAlternateCodes =
      explicitAlternateCodes !== undefined || brandCodeChanged;

    await this.dataSource.transaction(async (transactionManager) => {
      const productRepository = transactionManager.getRepository(Product);
      const alternateCodeRepository =
        transactionManager.getRepository(ProductAlternateCode);

      const productToUpdate = await productRepository.preload(updatePayload);
      if (!productToUpdate) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }
      await productRepository.save(productToUpdate);

      if (shouldReplaceAlternateCodes) {
        const effectiveBrandCode =
          directFields.brandCode ?? existingProduct.brandCode;
        const derivedCodes = deriveAlternateCodes(
          effectiveBrandCode,
          explicitAlternateCodes ?? [],
        );
        await alternateCodeRepository.delete({ productId });
        await alternateCodeRepository.save(
          derivedCodes.map((alternateCode) =>
            alternateCodeRepository.create({ productId, code: alternateCode }),
          ),
        );
      }
    });

    return this.productsFindRepository.findById(productId);
  }

  private async validateProvidedForeignKeys(
    updateProductDto: UpdateProductDto,
  ): Promise<void> {
    if (updateProductDto.brandId !== undefined) {
      await this.ensureReferenceExists(
        () =>
          this.brandsFindRepository.findById(
            updateProductDto.brandId as string,
          ),
        'brandId',
        'brand',
      );
    }
    if (updateProductDto.supplierId !== undefined) {
      await this.ensureReferenceExists(
        () =>
          this.suppliersFindRepository.findById(
            updateProductDto.supplierId as string,
          ),
        'supplierId',
        'supplier',
      );
    }
    if (updateProductDto.categoryId !== undefined) {
      await this.ensureReferenceExists(
        () =>
          this.categoriesFindRepository.findById(
            updateProductDto.categoryId as string,
          ),
        'categoryId',
        'category',
      );
    }
    if (
      updateProductDto.capacityUnitId !== undefined &&
      updateProductDto.capacityUnitId !== null
    ) {
      await this.ensureReferenceExists(
        () =>
          this.unitsMeasureFindRepository.findById(
            updateProductDto.capacityUnitId as string,
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
}
