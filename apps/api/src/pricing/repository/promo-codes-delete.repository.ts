import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity.js';
import { DeletePromoCodeDto } from '../dtos/delete-promo-code.dto.js';
import { PromoCodesFindRepository } from './promo-codes-find.repository.js';

@Injectable()
export class PromoCodesDeleteRepository {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    private readonly promoCodesFindRepository: PromoCodesFindRepository,
  ) {}

  async deactivate(promoCodeId: string): Promise<DeletePromoCodeDto> {
    const promoCodeToDeactivate =
      await this.promoCodesFindRepository.findById(promoCodeId);

    promoCodeToDeactivate.isActive = false;
    await this.promoCodeRepository.save(promoCodeToDeactivate);

    return {
      id: promoCodeToDeactivate.id,
      message: 'Promo code deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
