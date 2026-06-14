import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PromoCodeRedemption } from '../entities/promo-code-redemption.entity.js';

export interface RecordRedemptionInput {
  promoCodeId: string;
  orderId: string | null;
  customerId: string | null;
  discountAmount: number;
  isFreeDelivery: boolean;
}

@Injectable()
export class RedemptionsCreateRepository {
  constructor(
    @InjectRepository(PromoCodeRedemption)
    private readonly redemptionRepository: Repository<PromoCodeRedemption>,
  ) {}

  /**
   * Inserts a redemption row. Accepts checkout's EntityManager so the insert
   * commits (or rolls back) atomically with the order.
   */
  async record(
    input: RecordRedemptionInput,
    manager?: EntityManager,
  ): Promise<PromoCodeRedemption> {
    const repository = manager
      ? manager.getRepository(PromoCodeRedemption)
      : this.redemptionRepository;

    const redemption = repository.create({
      promoCodeId: input.promoCodeId,
      orderId: input.orderId,
      customerId: input.customerId,
      discountAmount: input.discountAmount.toFixed(2),
      isFreeDelivery: input.isFreeDelivery,
    });
    return repository.save(redemption);
  }
}
