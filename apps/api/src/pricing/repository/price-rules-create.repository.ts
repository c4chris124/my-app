import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRule } from '../entities/price-rule.entity.js';
import { CreatePriceRuleDto } from '../dtos/create-price-rule.dto.js';
import { PriceRulesFindRepository } from './price-rules-find.repository.js';
import { assertPriceRuleConsistency } from '../price-rule.helpers.js';
import { toDecimalString } from '../../products/repository/product-write.helpers.js';
import { BrandsFindRepository } from '../../brands/repository/brands-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';

@Injectable()
export class PriceRulesCreateRepository {
  constructor(
    @InjectRepository(PriceRule)
    private readonly priceRuleRepository: Repository<PriceRule>,
    private readonly priceRulesFindRepository: PriceRulesFindRepository,
    private readonly brandsFindRepository: BrandsFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
    private readonly productsFindRepository: ProductsFindRepository,
  ) {}

  async create(createPriceRuleDto: CreatePriceRuleDto): Promise<PriceRule> {
    assertPriceRuleConsistency({
      scope: createPriceRuleDto.scope,
      scopeCategoryId: createPriceRuleDto.scopeCategoryId ?? null,
      scopeBrandId: createPriceRuleDto.scopeBrandId ?? null,
      scopeProductId: createPriceRuleDto.scopeProductId ?? null,
      discountType: createPriceRuleDto.discountType ?? 'PERCENTAGE',
      discountValue: createPriceRuleDto.discountValue,
      validFrom: createPriceRuleDto.validFrom
        ? new Date(createPriceRuleDto.validFrom)
        : null,
      validUntil: createPriceRuleDto.validUntil
        ? new Date(createPriceRuleDto.validUntil)
        : null,
    });

    await this.validateScopeForeignKeys(createPriceRuleDto);

    const newPriceRule = this.priceRuleRepository.create({
      name: createPriceRuleDto.name,
      description: createPriceRuleDto.description ?? null,
      ruleType: createPriceRuleDto.ruleType,
      scope: createPriceRuleDto.scope,
      scopeCategoryId: createPriceRuleDto.scopeCategoryId ?? null,
      scopeBrandId: createPriceRuleDto.scopeBrandId ?? null,
      scopeProductId: createPriceRuleDto.scopeProductId ?? null,
      discountType: createPriceRuleDto.discountType ?? 'PERCENTAGE',
      discountValue: toDecimalString(
        createPriceRuleDto.discountValue,
      ) as string,
      minQuantity: createPriceRuleDto.minQuantity ?? 1,
      minOrderValue: toDecimalString(createPriceRuleDto.minOrderValue ?? null),
      priority: createPriceRuleDto.priority ?? 0,
      isStackable: createPriceRuleDto.isStackable ?? false,
      isActive: createPriceRuleDto.isActive ?? true,
      validFrom: createPriceRuleDto.validFrom
        ? new Date(createPriceRuleDto.validFrom)
        : null,
      validUntil: createPriceRuleDto.validUntil
        ? new Date(createPriceRuleDto.validUntil)
        : null,
    });
    const savedPriceRule = await this.priceRuleRepository.save(newPriceRule);

    return this.priceRulesFindRepository.findById(savedPriceRule.id);
  }

  private async validateScopeForeignKeys(
    createPriceRuleDto: CreatePriceRuleDto,
  ): Promise<void> {
    if (createPriceRuleDto.scopeCategoryId) {
      await this.ensureReferenceExists(
        () =>
          this.categoriesFindRepository.findById(
            createPriceRuleDto.scopeCategoryId as string,
          ),
        'scopeCategoryId',
        'category',
      );
    }
    if (createPriceRuleDto.scopeBrandId) {
      await this.ensureReferenceExists(
        () =>
          this.brandsFindRepository.findById(
            createPriceRuleDto.scopeBrandId as string,
          ),
        'scopeBrandId',
        'brand',
      );
    }
    if (createPriceRuleDto.scopeProductId) {
      await this.ensureReferenceExists(
        () =>
          this.productsFindRepository.findById(
            createPriceRuleDto.scopeProductId as string,
          ),
        'scopeProductId',
        'product',
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
