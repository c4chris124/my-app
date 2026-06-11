import { BadRequestException } from '@nestjs/common';
import { PriceRuleScope } from '@myapp/shared';
import type { RuleDiscountType } from './entities/price-rule.entity.js';

/**
 * Cross-field consistency rules for price rules, shared by the create and
 * update repositories so a partial update can't produce an inconsistent
 * record. Pure function — no DB access.
 */

export interface PriceRuleConsistencyState {
  scope: PriceRuleScope;
  scopeCategoryId: string | null;
  scopeBrandId: string | null;
  scopeProductId: string | null;
  discountType: RuleDiscountType;
  discountValue: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
}

export function assertPriceRuleConsistency(
  state: PriceRuleConsistencyState,
): void {
  const requiredScopeIdByScope: Record<
    PriceRuleScope,
    keyof PriceRuleConsistencyState | null
  > = {
    [PriceRuleScope.ALL_PRODUCTS]: null,
    [PriceRuleScope.CATEGORY]: 'scopeCategoryId',
    [PriceRuleScope.BRAND]: 'scopeBrandId',
    [PriceRuleScope.PRODUCT]: 'scopeProductId',
  };

  const requiredScopeId = requiredScopeIdByScope[state.scope];
  if (requiredScopeId !== null && state[requiredScopeId] === null) {
    throw new BadRequestException(
      `${requiredScopeId} is required when scope is ${state.scope}`,
    );
  }

  const allScopeIdFields = [
    'scopeCategoryId',
    'scopeBrandId',
    'scopeProductId',
  ] as const;
  for (const scopeIdField of allScopeIdFields) {
    if (scopeIdField !== requiredScopeId && state[scopeIdField] !== null) {
      throw new BadRequestException(
        `${scopeIdField} must be null when scope is ${state.scope}`,
      );
    }
  }

  if (state.discountValue === null || state.discountValue <= 0) {
    throw new BadRequestException('discountValue greater than 0 is required');
  }
  if (state.discountType === 'PERCENTAGE' && state.discountValue > 100) {
    throw new BadRequestException(
      'discountValue cannot exceed 100 when discountType is PERCENTAGE',
    );
  }

  if (
    state.validFrom !== null &&
    state.validUntil !== null &&
    state.validUntil <= state.validFrom
  ) {
    throw new BadRequestException('validUntil must be after validFrom');
  }
}
