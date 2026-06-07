export enum PriceRuleType {
  TRADE_TIER = 'TRADE_TIER',
  VOLUME = 'VOLUME',
  CLEARANCE = 'CLEARANCE',
  CUSTOM = 'CUSTOM',
}

export enum PriceRuleScope {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  PRODUCT = 'PRODUCT',
}

export enum PromoApplyScope {
  CART = 'CART',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_DELIVERY = 'FREE_DELIVERY',
}

export interface PriceBreakdown {
  productId: string;
  sku: string;
  basePrice: number;
  priceAfterRules: number;
  priceAfterPromo: number;
  totalSavings: number;
  isFreeDelivery: boolean;
  appliedRules: AppliedRule[];
  appliedPromoCode: AppliedPromo | null;
}

export interface AppliedRule {
  ruleId: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  amountSaved: number;
}

export interface AppliedPromo {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';
  discountValue: number | null;
  amountSaved: number;
}

export interface CartContext {
  items: Array<{ productId: string; quantity: number }>;
  customerId?: string;
  orderTotal: number;
}

export interface PriceRuleSummaryDto {
  id: string;
  name: string;
  ruleType: PriceRuleType;
  scope: PriceRuleScope;
  discountType: DiscountType;
  discountValue: number;
  minQuantity: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export interface PromoCodeSummaryDto {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number | null;
  applyScope: PromoApplyScope;
  currentUses: number;
  maxUsesTotal: number | null;
  isActive: boolean;
  validUntil: string | null;
}
