import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginatedResult,
  PromoCodesFindRepository,
} from './repository/promo-codes-find.repository.js';
import { PromoCodesCreateRepository } from './repository/promo-codes-create.repository.js';
import { PromoCodesUpdateRepository } from './repository/promo-codes-update.repository.js';
import { PromoCodesDeleteRepository } from './repository/promo-codes-delete.repository.js';
import { CreatePromoCodeDto } from './dtos/create-promo-code.dto.js';
import { UpdatePromoCodeDto } from './dtos/update-promo-code.dto.js';
import { GetPromoCodeDto } from './dtos/get-promo-code.dto.js';
import { ValidatePromoCodeDto } from './dtos/validate-promo-code.dto.js';
import { DeletePromoCodeDto } from './dtos/delete-promo-code.dto.js';
import {
  PromoCodeResponseDto,
  PromoValidationResultDto,
} from './dtos/promo-code-response.dto.js';

@Injectable()
export class PromoCodesService {
  constructor(
    private readonly promoCodesFindRepository: PromoCodesFindRepository,
    private readonly promoCodesCreateRepository: PromoCodesCreateRepository,
    private readonly promoCodesUpdateRepository: PromoCodesUpdateRepository,
    private readonly promoCodesDeleteRepository: PromoCodesDeleteRepository,
  ) {}

  async findAll(
    query: GetPromoCodeDto,
  ): Promise<PaginatedResult<PromoCodeResponseDto>> {
    const paginatedPromoCodes =
      await this.promoCodesFindRepository.findAll(query);
    return {
      ...paginatedPromoCodes,
      data: paginatedPromoCodes.data.map((promoCode) =>
        PromoCodeResponseDto.fromEntity(promoCode),
      ),
    };
  }

  async findOne(promoCodeId: string): Promise<PromoCodeResponseDto> {
    const promoCode = await this.promoCodesFindRepository.findById(promoCodeId);
    return PromoCodeResponseDto.fromEntity(promoCode);
  }

  async findByCode(code: string): Promise<PromoCodeResponseDto> {
    const promoCode = await this.promoCodesFindRepository.findByCode(code);
    if (!promoCode) {
      throw new NotFoundException(`Promo code '${code}' not found`);
    }
    return PromoCodeResponseDto.fromEntity(promoCode);
  }

  async create(
    createPromoCodeDto: CreatePromoCodeDto,
  ): Promise<PromoCodeResponseDto> {
    const createdPromoCode =
      await this.promoCodesCreateRepository.create(createPromoCodeDto);
    return PromoCodeResponseDto.fromEntity(createdPromoCode);
  }

  async update(
    promoCodeId: string,
    updatePromoCodeDto: UpdatePromoCodeDto,
  ): Promise<PromoCodeResponseDto> {
    const updatedPromoCode = await this.promoCodesUpdateRepository.update(
      promoCodeId,
      updatePromoCodeDto,
    );
    return PromoCodeResponseDto.fromEntity(updatedPromoCode);
  }

  remove(promoCodeId: string): Promise<DeletePromoCodeDto> {
    return this.promoCodesDeleteRepository.deactivate(promoCodeId);
  }

  // Pure read-only state check — no discount math, no per-customer history,
  // no redemption recorded. Those belong to the Pricing/Redemptions flow.
  async validate(
    validatePromoCodeDto: ValidatePromoCodeDto,
  ): Promise<PromoValidationResultDto> {
    const promoCode = await this.promoCodesFindRepository.findByCode(
      validatePromoCodeDto.code,
    );
    if (!promoCode) {
      return { valid: false, reason: 'NOT_FOUND' };
    }
    if (!promoCode.isActive) {
      return { valid: false, reason: 'INACTIVE' };
    }

    const now = new Date();
    if (promoCode.validFrom !== null && promoCode.validFrom > now) {
      return { valid: false, reason: 'NOT_YET_VALID' };
    }
    if (promoCode.validUntil !== null && promoCode.validUntil < now) {
      return { valid: false, reason: 'EXPIRED' };
    }
    if (
      promoCode.maxUsesTotal !== null &&
      promoCode.currentUses >= promoCode.maxUsesTotal
    ) {
      return { valid: false, reason: 'USAGE_LIMIT_REACHED' };
    }

    return {
      valid: true,
      promoCode: PromoCodeResponseDto.fromEntity(promoCode),
    };
  }
}
