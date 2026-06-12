import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PromoCodeRedemption } from '../entities/promo-code-redemption.entity.js';
import { GetRedemptionDto } from '../dtos/get-redemption.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class RedemptionsFindRepository {
  constructor(
    @InjectRepository(PromoCodeRedemption)
    private readonly redemptionRepository: Repository<PromoCodeRedemption>,
  ) {}

  /**
   * Per-customer usage count for enforcing maxUsesPerCustomer. Accepts
   * checkout's EntityManager so the count reads inside the transaction.
   */
  async countByPromoAndCustomer(
    promoCodeId: string,
    customerId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = manager
      ? manager.getRepository(PromoCodeRedemption)
      : this.redemptionRepository;
    return repository.count({ where: { promoCodeId, customerId } });
  }

  async findByOrder(orderId: string): Promise<PromoCodeRedemption[]> {
    return this.redemptionRepository.find({
      where: { orderId },
      relations: { promoCode: true, order: true, customer: true },
      order: { appliedAt: 'ASC' },
    });
  }

  async findAll(
    query: GetRedemptionDto,
  ): Promise<PaginatedResult<PromoCodeRedemption>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const redemptionsQuery = this.redemptionRepository
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.promoCode', 'promoCode')
      .leftJoinAndSelect('redemption.order', 'ord')
      .leftJoinAndSelect('redemption.customer', 'customer');

    if (query.promoCodeId) {
      redemptionsQuery.andWhere('redemption.promoCodeId = :promoCodeId', {
        promoCodeId: query.promoCodeId,
      });
    }

    if (query.customerId) {
      redemptionsQuery.andWhere('redemption.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.orderId) {
      redemptionsQuery.andWhere('redemption.orderId = :orderId', {
        orderId: query.orderId,
      });
    }

    if (query.appliedFrom) {
      redemptionsQuery.andWhere('redemption.appliedAt >= :appliedFrom', {
        appliedFrom: query.appliedFrom,
      });
    }

    if (query.appliedTo) {
      redemptionsQuery.andWhere('redemption.appliedAt <= :appliedTo', {
        appliedTo: query.appliedTo,
      });
    }

    const [redemptions, totalRedemptions] = await redemptionsQuery
      .orderBy('redemption.appliedAt', 'DESC')
      .addOrderBy('redemption.id', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: redemptions,
      total: totalRedemptions,
      page: currentPage,
      limit: itemsPerPage,
    };
  }
}
