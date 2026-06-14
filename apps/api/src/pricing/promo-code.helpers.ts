import { BadRequestException } from '@nestjs/common';
import { PromoApplyScope } from '@myapp/shared';
import { PromoDiscountType } from './entities/promo-code.entity.js';

/**
 * Cross-field consistency rules for promo codes, shared by the create and
 * update repositories so a partial update can't produce an inconsistent
 * record. Pure function — no DB access.
 */

export interface PromoConsistencyState {
  discountType: PromoDiscountType;
  discountValue: number | null;
  applyScope: PromoApplyScope;
  scopeProductId: string | null;
  scopeCategoryId: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
}

export function assertPromoConsistency(state: PromoConsistencyState): void {
  if (state.discountType === 'FREE_DELIVERY') {
    if (state.discountValue !== null) {
      throw new BadRequestException(
        'discountValue must be omitted when discountType is FREE_DELIVERY',
      );
    }
  } else {
    if (state.discountValue === null || state.discountValue <= 0) {
      throw new BadRequestException(
        `discountValue greater than 0 is required when discountType is ${state.discountType}`,
      );
    }
    if (state.discountType === 'PERCENTAGE' && state.discountValue > 100) {
      throw new BadRequestException(
        'discountValue cannot exceed 100 when discountType is PERCENTAGE',
      );
    }
  }

  switch (state.applyScope) {
    case PromoApplyScope.CART:
      if (state.scopeProductId !== null || state.scopeCategoryId !== null) {
        throw new BadRequestException(
          'scopeProductId and scopeCategoryId must be null when applyScope is CART',
        );
      }
      break;
    case PromoApplyScope.PRODUCT:
      if (state.scopeProductId === null) {
        throw new BadRequestException(
          'scopeProductId is required when applyScope is PRODUCT',
        );
      }
      if (state.scopeCategoryId !== null) {
        throw new BadRequestException(
          'scopeCategoryId must be null when applyScope is PRODUCT',
        );
      }
      break;
    case PromoApplyScope.CATEGORY:
      if (state.scopeCategoryId === null) {
        throw new BadRequestException(
          'scopeCategoryId is required when applyScope is CATEGORY',
        );
      }
      if (state.scopeProductId !== null) {
        throw new BadRequestException(
          'scopeProductId must be null when applyScope is CATEGORY',
        );
      }
      break;
  }

  if (
    state.validFrom !== null &&
    state.validUntil !== null &&
    state.validUntil <= state.validFrom
  ) {
    throw new BadRequestException('validUntil must be after validFrom');
  }
}
