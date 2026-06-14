import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity.js';
import { CreatePromoCodeDto } from '../dtos/create-promo-code.dto.js';
import { PromoCodesFindRepository } from './promo-codes-find.repository.js';
import { assertPromoConsistency } from '../promo-code.helpers.js';
import { toDecimalString } from '../../products/repository/product-write.helpers.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';
import { CategoriesFindRepository } from '../../categories/repository/categories-find.repository.js';

@Injectable()
export class PromoCodesCreateRepository {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    private readonly promoCodesFindRepository: PromoCodesFindRepository,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly categoriesFindRepository: CategoriesFindRepository,
  ) {}

  async create(createPromoCodeDto: CreatePromoCodeDto): Promise<PromoCode> {
    const normalizedCode = createPromoCodeDto.code.trim().toUpperCase();

    const promoCodeWithSameCode =
      await this.promoCodesFindRepository.findByCode(normalizedCode);
    if (promoCodeWithSameCode) {
      throw new ConflictException('Promo code already exists');
    }

    assertPromoConsistency({
      discountType: createPromoCodeDto.discountType,
      discountValue: createPromoCodeDto.discountValue ?? null,
      applyScope: createPromoCodeDto.applyScope,
      scopeProductId: createPromoCodeDto.scopeProductId ?? null,
      scopeCategoryId: createPromoCodeDto.scopeCategoryId ?? null,
      validFrom: createPromoCodeDto.validFrom
        ? new Date(createPromoCodeDto.validFrom)
        : null,
      validUntil: createPromoCodeDto.validUntil
        ? new Date(createPromoCodeDto.validUntil)
        : null,
    });

    if (createPromoCodeDto.scopeProductId) {
      await this.ensureReferenceExists(
        () =>
          this.productsFindRepository.findById(
            createPromoCodeDto.scopeProductId as string,
          ),
        'scopeProductId',
        'product',
      );
    }
    if (createPromoCodeDto.scopeCategoryId) {
      await this.ensureReferenceExists(
        () =>
          this.categoriesFindRepository.findById(
            createPromoCodeDto.scopeCategoryId as string,
          ),
        'scopeCategoryId',
        'category',
      );
    }

    const newPromoCode = this.promoCodeRepository.create({
      code: normalizedCode,
      description: createPromoCodeDto.description,
      discountType: createPromoCodeDto.discountType,
      discountValue: toDecimalString(createPromoCodeDto.discountValue ?? null),
      applyScope: createPromoCodeDto.applyScope,
      scopeProductId: createPromoCodeDto.scopeProductId ?? null,
      scopeCategoryId: createPromoCodeDto.scopeCategoryId ?? null,
      minQuantity: createPromoCodeDto.minQuantity ?? 1,
      minOrderValue: toDecimalString(createPromoCodeDto.minOrderValue ?? null),
      maxUsesTotal: createPromoCodeDto.maxUsesTotal ?? null,
      maxUsesPerCustomer: createPromoCodeDto.maxUsesPerCustomer ?? 1,
      isActive: createPromoCodeDto.isActive ?? true,
      validFrom: createPromoCodeDto.validFrom
        ? new Date(createPromoCodeDto.validFrom)
        : null,
      validUntil: createPromoCodeDto.validUntil
        ? new Date(createPromoCodeDto.validUntil)
        : null,
      currentUses: 0,
    });
    const savedPromoCode = await this.promoCodeRepository.save(newPromoCode);

    return this.promoCodesFindRepository.findById(savedPromoCode.id);
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
