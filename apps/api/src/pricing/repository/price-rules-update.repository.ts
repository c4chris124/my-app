import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRule } from '../entities/price-rule.entity.js';
import { UpdatePriceRuleDto } from '../dtos/update-price-rule.dto.js';
import { PriceRulesFindRepository } from './price-rules-find.repository.js';
import { assertPriceRuleConsistency } from '../price-rule.helpers.js';
import { toDecimalString } from '../../products/repository/product-write.helpers.js';
import { BrandsFindRepository } from '../../brands/repository/brands-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';

@Injectable()
export class PriceRulesUpdateRepository {
  constructor(
    @InjectRepository(PriceRule)
    private readonly priceRuleRepository: Repository<PriceRule>,
    private readonly priceRulesFindRepository: PriceRulesFindRepository,
    private readonly brandsFindRepository: BrandsFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
    private readonly productsFindRepository: ProductsFindRepository,
  ) {}

  async update(
    priceRuleId: string,
    updatePriceRuleDto: UpdatePriceRuleDto,
  ): Promise<PriceRule> {
    const existingPriceRule =
      await this.priceRulesFindRepository.findById(priceRuleId);

    // values provided as null clear the field, so treat "!== undefined" as provided
    const effectiveValidFrom =
      updatePriceRuleDto.validFrom !== undefined
        ? updatePriceRuleDto.validFrom
          ? new Date(updatePriceRuleDto.validFrom)
          : null
        : existingPriceRule.validFrom;
    const effectiveValidUntil =
      updatePriceRuleDto.validUntil !== undefined
        ? updatePriceRuleDto.validUntil
          ? new Date(updatePriceRuleDto.validUntil)
          : null
        : existingPriceRule.validUntil;

    assertPriceRuleConsistency({
      scope: updatePriceRuleDto.scope ?? existingPriceRule.scope,
      scopeCategoryId:
        updatePriceRuleDto.scopeCategoryId !== undefined
          ? updatePriceRuleDto.scopeCategoryId
          : existingPriceRule.scopeCategoryId,
      scopeBrandId:
        updatePriceRuleDto.scopeBrandId !== undefined
          ? updatePriceRuleDto.scopeBrandId
          : existingPriceRule.scopeBrandId,
      scopeProductId:
        updatePriceRuleDto.scopeProductId !== undefined
          ? updatePriceRuleDto.scopeProductId
          : existingPriceRule.scopeProductId,
      discountType:
        updatePriceRuleDto.discountType ?? existingPriceRule.discountType,
      discountValue:
        updatePriceRuleDto.discountValue !== undefined
          ? updatePriceRuleDto.discountValue
          : Number(existingPriceRule.discountValue),
      validFrom: effectiveValidFrom,
      validUntil: effectiveValidUntil,
    });

    await this.validateProvidedScopeForeignKeys(updatePriceRuleDto);

    const updatePayload: Partial<PriceRule> & { id: string } = {
      id: priceRuleId,
    };
    if (updatePriceRuleDto.name !== undefined) {
      updatePayload.name = updatePriceRuleDto.name;
    }
    if (updatePriceRuleDto.description !== undefined) {
      updatePayload.description = updatePriceRuleDto.description;
    }
    if (updatePriceRuleDto.ruleType !== undefined) {
      updatePayload.ruleType = updatePriceRuleDto.ruleType;
    }
    if (updatePriceRuleDto.scope !== undefined) {
      updatePayload.scope = updatePriceRuleDto.scope;
    }
    if (updatePriceRuleDto.scopeCategoryId !== undefined) {
      updatePayload.scopeCategoryId = updatePriceRuleDto.scopeCategoryId;
    }
    if (updatePriceRuleDto.scopeBrandId !== undefined) {
      updatePayload.scopeBrandId = updatePriceRuleDto.scopeBrandId;
    }
    if (updatePriceRuleDto.scopeProductId !== undefined) {
      updatePayload.scopeProductId = updatePriceRuleDto.scopeProductId;
    }
    if (updatePriceRuleDto.discountType !== undefined) {
      updatePayload.discountType = updatePriceRuleDto.discountType;
    }
    if (updatePriceRuleDto.discountValue !== undefined) {
      updatePayload.discountValue = toDecimalString(
        updatePriceRuleDto.discountValue,
      ) as string;
    }
    if (updatePriceRuleDto.minQuantity !== undefined) {
      updatePayload.minQuantity = updatePriceRuleDto.minQuantity;
    }
    if (updatePriceRuleDto.minOrderValue !== undefined) {
      updatePayload.minOrderValue = toDecimalString(
        updatePriceRuleDto.minOrderValue,
      );
    }
    if (updatePriceRuleDto.priority !== undefined) {
      updatePayload.priority = updatePriceRuleDto.priority;
    }
    if (updatePriceRuleDto.isStackable !== undefined) {
      updatePayload.isStackable = updatePriceRuleDto.isStackable;
    }
    if (updatePriceRuleDto.isActive !== undefined) {
      updatePayload.isActive = updatePriceRuleDto.isActive;
    }
    if (updatePriceRuleDto.validFrom !== undefined) {
      updatePayload.validFrom = effectiveValidFrom;
    }
    if (updatePriceRuleDto.validUntil !== undefined) {
      updatePayload.validUntil = effectiveValidUntil;
    }

    const priceRuleToUpdate =
      await this.priceRuleRepository.preload(updatePayload);
    if (!priceRuleToUpdate) {
      throw new NotFoundException(
        `Price rule with id ${priceRuleId} not found`,
      );
    }
    await this.priceRuleRepository.save(priceRuleToUpdate);

    return this.priceRulesFindRepository.findById(priceRuleId);
  }

  private async validateProvidedScopeForeignKeys(
    updatePriceRuleDto: UpdatePriceRuleDto,
  ): Promise<void> {
    if (updatePriceRuleDto.scopeCategoryId) {
      await this.ensureReferenceExists(
        () =>
          this.categoriesFindRepository.findById(
            updatePriceRuleDto.scopeCategoryId as string,
          ),
        'scopeCategoryId',
        'category',
      );
    }
    if (updatePriceRuleDto.scopeBrandId) {
      await this.ensureReferenceExists(
        () =>
          this.brandsFindRepository.findById(
            updatePriceRuleDto.scopeBrandId as string,
          ),
        'scopeBrandId',
        'brand',
      );
    }
    if (updatePriceRuleDto.scopeProductId) {
      await this.ensureReferenceExists(
        () =>
          this.productsFindRepository.findById(
            updatePriceRuleDto.scopeProductId as string,
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
