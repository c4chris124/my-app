import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRule } from '../entities/price-rule.entity.js';
import { DeletePriceRuleDto } from '../dtos/delete-price-rule.dto.js';
import { PriceRulesFindRepository } from './price-rules-find.repository.js';

@Injectable()
export class PriceRulesDeleteRepository {
  constructor(
    @InjectRepository(PriceRule)
    private readonly priceRuleRepository: Repository<PriceRule>,
    private readonly priceRulesFindRepository: PriceRulesFindRepository,
  ) {}

  async deactivate(priceRuleId: string): Promise<DeletePriceRuleDto> {
    const priceRuleToDeactivate =
      await this.priceRulesFindRepository.findById(priceRuleId);

    priceRuleToDeactivate.isActive = false;
    await this.priceRuleRepository.save(priceRuleToDeactivate);

    return {
      id: priceRuleToDeactivate.id,
      message: 'Price rule deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
