import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceRuleScope, PriceRuleType } from '@myapp/shared';
import { PriceRule } from '../entities/price-rule.entity.js';
import type { RuleDiscountType } from '../entities/price-rule.entity.js';

const toNumberOrNull = (decimalString: string | null): number | null =>
  decimalString === null ? null : Number(decimalString);

export class RuleScopeRefDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'COOKMATE' })
  name: string;
}

export class RuleScopeProductRefDto extends RuleScopeRefDto {
  @ApiProperty({ example: 'RHB-00001' })
  sku: string;
}

export class PriceRuleResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Volume 10+' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: PriceRuleType, example: PriceRuleType.VOLUME })
  ruleType: PriceRuleType;

  @ApiProperty({ enum: PriceRuleScope, example: PriceRuleScope.ALL_PRODUCTS })
  scope: PriceRuleScope;

  @ApiPropertyOptional({ type: RuleScopeRefDto, nullable: true })
  scopeCategory: RuleScopeRefDto | null;

  @ApiPropertyOptional({ nullable: true })
  scopeCategoryId: string | null;

  @ApiPropertyOptional({ type: RuleScopeRefDto, nullable: true })
  scopeBrand: RuleScopeRefDto | null;

  @ApiPropertyOptional({ nullable: true })
  scopeBrandId: string | null;

  @ApiPropertyOptional({ type: RuleScopeProductRefDto, nullable: true })
  scopeProduct: RuleScopeProductRefDto | null;

  @ApiPropertyOptional({ nullable: true })
  scopeProductId: string | null;

  @ApiProperty({ example: 'PERCENTAGE' })
  discountType: RuleDiscountType;

  @ApiProperty({ example: 12 })
  discountValue: number;

  @ApiProperty({ example: 1 })
  minQuantity: number;

  @ApiPropertyOptional({ example: 5000, nullable: true })
  minOrderValue: number | null;

  @ApiProperty({ example: 20 })
  priority: number;

  @ApiProperty({ example: false })
  isStackable: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  validFrom: Date | null;

  @ApiPropertyOptional({ nullable: true })
  validUntil: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(priceRule: PriceRule): PriceRuleResponseDto {
    const ruleResponse = new PriceRuleResponseDto();
    ruleResponse.id = priceRule.id;
    ruleResponse.name = priceRule.name;
    ruleResponse.description = priceRule.description;
    ruleResponse.ruleType = priceRule.ruleType;
    ruleResponse.scope = priceRule.scope;
    ruleResponse.scopeCategory = priceRule.scopeCategory
      ? { id: priceRule.scopeCategory.id, name: priceRule.scopeCategory.name }
      : null;
    ruleResponse.scopeCategoryId = priceRule.scopeCategoryId;
    ruleResponse.scopeBrand = priceRule.scopeBrand
      ? { id: priceRule.scopeBrand.id, name: priceRule.scopeBrand.name }
      : null;
    ruleResponse.scopeBrandId = priceRule.scopeBrandId;
    ruleResponse.scopeProduct = priceRule.scopeProduct
      ? {
          id: priceRule.scopeProduct.id,
          name: priceRule.scopeProduct.name,
          sku: priceRule.scopeProduct.sku,
        }
      : null;
    ruleResponse.scopeProductId = priceRule.scopeProductId;
    ruleResponse.discountType = priceRule.discountType;
    ruleResponse.discountValue = Number(priceRule.discountValue);
    ruleResponse.minQuantity = priceRule.minQuantity;
    ruleResponse.minOrderValue = toNumberOrNull(priceRule.minOrderValue);
    ruleResponse.priority = priceRule.priority;
    ruleResponse.isStackable = priceRule.isStackable;
    ruleResponse.isActive = priceRule.isActive;
    ruleResponse.validFrom = priceRule.validFrom;
    ruleResponse.validUntil = priceRule.validUntil;
    ruleResponse.createdAt = priceRule.createdAt;
    ruleResponse.updatedAt = priceRule.updatedAt;
    return ruleResponse;
  }
}
