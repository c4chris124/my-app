import { Injectable } from '@nestjs/common';
import {
  PaginatedResult,
  PriceRulesFindRepository,
} from './repository/price-rules-find.repository.js';
import { PriceRulesCreateRepository } from './repository/price-rules-create.repository.js';
import { PriceRulesUpdateRepository } from './repository/price-rules-update.repository.js';
import { PriceRulesDeleteRepository } from './repository/price-rules-delete.repository.js';
import { CreatePriceRuleDto } from './dtos/create-price-rule.dto.js';
import { UpdatePriceRuleDto } from './dtos/update-price-rule.dto.js';
import { GetPriceRuleDto } from './dtos/get-price-rule.dto.js';
import { DeletePriceRuleDto } from './dtos/delete-price-rule.dto.js';
import { PriceRuleResponseDto } from './dtos/price-rule-response.dto.js';

@Injectable()
export class PriceRulesService {
  constructor(
    private readonly priceRulesFindRepository: PriceRulesFindRepository,
    private readonly priceRulesCreateRepository: PriceRulesCreateRepository,
    private readonly priceRulesUpdateRepository: PriceRulesUpdateRepository,
    private readonly priceRulesDeleteRepository: PriceRulesDeleteRepository,
  ) {}

  async findAll(
    query: GetPriceRuleDto,
  ): Promise<PaginatedResult<PriceRuleResponseDto>> {
    const paginatedPriceRules =
      await this.priceRulesFindRepository.findAll(query);
    return {
      ...paginatedPriceRules,
      data: paginatedPriceRules.data.map((priceRule) =>
        PriceRuleResponseDto.fromEntity(priceRule),
      ),
    };
  }

  async findOne(priceRuleId: string): Promise<PriceRuleResponseDto> {
    const priceRule = await this.priceRulesFindRepository.findById(priceRuleId);
    return PriceRuleResponseDto.fromEntity(priceRule);
  }

  async create(
    createPriceRuleDto: CreatePriceRuleDto,
  ): Promise<PriceRuleResponseDto> {
    const createdPriceRule =
      await this.priceRulesCreateRepository.create(createPriceRuleDto);
    return PriceRuleResponseDto.fromEntity(createdPriceRule);
  }

  async update(
    priceRuleId: string,
    updatePriceRuleDto: UpdatePriceRuleDto,
  ): Promise<PriceRuleResponseDto> {
    const updatedPriceRule = await this.priceRulesUpdateRepository.update(
      priceRuleId,
      updatePriceRuleDto,
    );
    return PriceRuleResponseDto.fromEntity(updatedPriceRule);
  }

  remove(priceRuleId: string): Promise<DeletePriceRuleDto> {
    return this.priceRulesDeleteRepository.deactivate(priceRuleId);
  }
}
