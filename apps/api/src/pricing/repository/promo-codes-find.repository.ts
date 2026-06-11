import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity.js';
import { GetPromoCodeDto } from '../dtos/get-promo-code.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class PromoCodesFindRepository {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
  ) {}

  async findById(promoCodeId: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id: promoCodeId },
      relations: { scopeProduct: true, scopeCategory: true },
    });
    if (!promoCode) {
      throw new NotFoundException(
        `Promo code with id ${promoCodeId} not found`,
      );
    }
    return promoCode;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const normalizedCode = code.trim().toUpperCase();
    return this.promoCodeRepository
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.scopeProduct', 'scopeProduct')
      .leftJoinAndSelect('promo.scopeCategory', 'scopeCategory')
      .where('UPPER(promo.code) = :code', { code: normalizedCode })
      .getOne();
  }

  async findAll(query: GetPromoCodeDto): Promise<PaginatedResult<PromoCode>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const promoCodesQuery = this.promoCodeRepository
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.scopeProduct', 'scopeProduct')
      .leftJoinAndSelect('promo.scopeCategory', 'scopeCategory');

    if (query.search) {
      promoCodesQuery.andWhere(
        '(promo.code ILIKE :search OR promo.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.discountType) {
      promoCodesQuery.andWhere('promo.discountType = :discountType', {
        discountType: query.discountType,
      });
    }

    if (query.applyScope) {
      promoCodesQuery.andWhere('promo.applyScope = :applyScope', {
        applyScope: query.applyScope,
      });
    }

    if (query.isActive !== undefined) {
      promoCodesQuery.andWhere('promo.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.activeNow) {
      promoCodesQuery
        .andWhere('promo.isActive = true')
        .andWhere('(promo.validFrom IS NULL OR promo.validFrom <= :now)', {
          now: new Date(),
        })
        .andWhere('(promo.validUntil IS NULL OR promo.validUntil >= :now)')
        .andWhere(
          '(promo.maxUsesTotal IS NULL OR promo.currentUses < promo.maxUsesTotal)',
        );
    }

    const [promoCodes, totalPromoCodes] = await promoCodesQuery
      .orderBy('promo.createdAt', 'DESC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: promoCodes,
      total: totalPromoCodes,
      page: currentPage,
      limit: itemsPerPage,
    };
  }
}
