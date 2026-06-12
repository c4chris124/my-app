import { Injectable } from '@nestjs/common';
import {
  PaginatedResult,
  RedemptionsFindRepository,
} from './repository/redemptions-find.repository.js';
import { GetRedemptionDto } from './dtos/get-redemption.dto.js';
import { RedemptionResponseDto } from './dtos/redemption-response.dto.js';

/**
 * Reporting only. Recording happens exclusively through the pricing engine
 * during checkout — redemptions are immutable financial records, so there is
 * no create/update/delete surface here.
 */
@Injectable()
export class RedemptionsService {
  constructor(
    private readonly redemptionsFindRepository: RedemptionsFindRepository,
  ) {}

  async findAll(
    query: GetRedemptionDto,
  ): Promise<PaginatedResult<RedemptionResponseDto>> {
    const paginatedRedemptions =
      await this.redemptionsFindRepository.findAll(query);
    return {
      ...paginatedRedemptions,
      data: paginatedRedemptions.data.map((redemption) =>
        RedemptionResponseDto.fromEntity(redemption),
      ),
    };
  }

  async findByOrder(orderId: string): Promise<RedemptionResponseDto[]> {
    const redemptions =
      await this.redemptionsFindRepository.findByOrder(orderId);
    return redemptions.map((redemption) =>
      RedemptionResponseDto.fromEntity(redemption),
    );
  }
}
