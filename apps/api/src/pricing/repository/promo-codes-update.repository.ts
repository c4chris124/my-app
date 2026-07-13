import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity.js';
import { UpdatePromoCodeDto } from '../dtos/update-promo-code.dto.js';
import { PromoCodesFindRepository } from './promo-codes-find.repository.js';
import { assertPromoConsistency } from '../promo-code.helpers.js';
import { toDecimalString } from '../../products/repository/product-write.helpers.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';

@Injectable()
export class PromoCodesUpdateRepository {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    private readonly promoCodesFindRepository: PromoCodesFindRepository,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
  ) {}

  async update(
    promoCodeId: string,
    updatePromoCodeDto: UpdatePromoCodeDto,
  ): Promise<PromoCode> {
    const existingPromoCode =
      await this.promoCodesFindRepository.findById(promoCodeId);

    const normalizedCode =
      updatePromoCodeDto.code !== undefined
        ? updatePromoCodeDto.code.trim().toUpperCase()
        : undefined;

    if (normalizedCode !== undefined) {
      const otherPromoCodeWithSameCode =
        await this.promoCodesFindRepository.findByCode(normalizedCode);
      if (
        otherPromoCodeWithSameCode &&
        otherPromoCodeWithSameCode.id !== promoCodeId
      ) {
        throw new ConflictException('Promo code already exists');
      }
    }

    // values provided as null clear the field, so treat "!== undefined" as provided
    const effectiveDiscountValue: number | null =
      updatePromoCodeDto.discountValue !== undefined
        ? updatePromoCodeDto.discountValue
        : existingPromoCode.discountValue === null
          ? null
          : Number(existingPromoCode.discountValue);
    const effectiveValidFrom =
      updatePromoCodeDto.validFrom !== undefined
        ? updatePromoCodeDto.validFrom
          ? new Date(updatePromoCodeDto.validFrom)
          : null
        : existingPromoCode.validFrom;
    const effectiveValidUntil =
      updatePromoCodeDto.validUntil !== undefined
        ? updatePromoCodeDto.validUntil
          ? new Date(updatePromoCodeDto.validUntil)
          : null
        : existingPromoCode.validUntil;

    assertPromoConsistency({
      discountType:
        updatePromoCodeDto.discountType ?? existingPromoCode.discountType,
      discountValue: effectiveDiscountValue,
      applyScope: updatePromoCodeDto.applyScope ?? existingPromoCode.applyScope,
      scopeProductId:
        updatePromoCodeDto.scopeProductId !== undefined
          ? updatePromoCodeDto.scopeProductId
          : existingPromoCode.scopeProductId,
      scopeCategoryId:
        updatePromoCodeDto.scopeCategoryId !== undefined
          ? updatePromoCodeDto.scopeCategoryId
          : existingPromoCode.scopeCategoryId,
      validFrom: effectiveValidFrom,
      validUntil: effectiveValidUntil,
    });

    if (updatePromoCodeDto.scopeProductId) {
      await this.ensureReferenceExists(
        () =>
          this.productsFindRepository.findById(
            updatePromoCodeDto.scopeProductId as string,
          ),
        'scopeProductId',
        'product',
      );
    }
    if (updatePromoCodeDto.scopeCategoryId) {
      await this.ensureReferenceExists(
        () =>
          this.categoriesFindRepository.findById(
            updatePromoCodeDto.scopeCategoryId as string,
          ),
        'scopeCategoryId',
        'category',
      );
    }

    const updatePayload: Partial<PromoCode> & { id: string } = {
      id: promoCodeId,
    };
    if (normalizedCode !== undefined) updatePayload.code = normalizedCode;
    if (updatePromoCodeDto.description !== undefined) {
      updatePayload.description = updatePromoCodeDto.description;
    }
    if (updatePromoCodeDto.discountType !== undefined) {
      updatePayload.discountType = updatePromoCodeDto.discountType;
    }
    if (updatePromoCodeDto.discountValue !== undefined) {
      updatePayload.discountValue = toDecimalString(
        updatePromoCodeDto.discountValue,
      );
    }
    if (updatePromoCodeDto.applyScope !== undefined) {
      updatePayload.applyScope = updatePromoCodeDto.applyScope;
    }
    if (updatePromoCodeDto.scopeProductId !== undefined) {
      updatePayload.scopeProductId = updatePromoCodeDto.scopeProductId;
    }
    if (updatePromoCodeDto.scopeCategoryId !== undefined) {
      updatePayload.scopeCategoryId = updatePromoCodeDto.scopeCategoryId;
    }
    if (updatePromoCodeDto.minQuantity !== undefined) {
      updatePayload.minQuantity = updatePromoCodeDto.minQuantity;
    }
    if (updatePromoCodeDto.minOrderValue !== undefined) {
      updatePayload.minOrderValue = toDecimalString(
        updatePromoCodeDto.minOrderValue,
      );
    }
    if (updatePromoCodeDto.maxUsesTotal !== undefined) {
      updatePayload.maxUsesTotal = updatePromoCodeDto.maxUsesTotal;
    }
    if (updatePromoCodeDto.maxUsesPerCustomer !== undefined) {
      updatePayload.maxUsesPerCustomer = updatePromoCodeDto.maxUsesPerCustomer;
    }
    if (updatePromoCodeDto.isActive !== undefined) {
      updatePayload.isActive = updatePromoCodeDto.isActive;
    }
    if (updatePromoCodeDto.validFrom !== undefined) {
      updatePayload.validFrom = effectiveValidFrom;
    }
    if (updatePromoCodeDto.validUntil !== undefined) {
      updatePayload.validUntil = effectiveValidUntil;
    }
    // currentUses is server-managed and never part of the payload

    const promoCodeToUpdate =
      await this.promoCodeRepository.preload(updatePayload);
    if (!promoCodeToUpdate) {
      throw new NotFoundException(
        `Promo code with id ${promoCodeId} not found`,
      );
    }
    await this.promoCodeRepository.save(promoCodeToUpdate);

    return this.promoCodesFindRepository.findById(promoCodeId);
  }

  /**
   * Race-safe global-cap increment for checkout. The WHERE clause makes the
   * cap check atomic: when the limit was hit concurrently, 0 rows are
   * affected and the caller must roll back. Accepts checkout's
   * EntityManager so the increment commits with the order + redemption.
   */
  async incrementUses(
    promoCodeId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = manager
      ? manager.getRepository(PromoCode)
      : this.promoCodeRepository;
    const result = await repository
      .createQueryBuilder()
      .update(PromoCode)
      .set({ currentUses: () => 'current_uses + 1' })
      .where('id = :promoCodeId', { promoCodeId })
      .andWhere('(max_uses_total IS NULL OR current_uses < max_uses_total)')
      .execute();
    return result.affected ?? 0;
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
