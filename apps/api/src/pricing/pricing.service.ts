import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRule } from './entities/price-rule.entity.js';
import { PromoCode } from './entities/promo-code.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { PromoCodeInvalidException } from '../common/exceptions/promo-code-invalid.exception.js';
import { PriceBreakdown, CartContext, AppliedRule, AppliedPromo } from '@myapp/shared';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceRule)
    private readonly ruleRepo: Repository<PriceRule>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
  ) {}

  async getApplicableRules(product: Product, quantity: number): Promise<PriceRule[]> {
    const now = new Date();
    const rules = await this.ruleRepo
      .createQueryBuilder('r')
      .where('r.isActive = true')
      .andWhere('(r.validFrom IS NULL OR r.validFrom <= :now)', { now })
      .andWhere('(r.validUntil IS NULL OR r.validUntil >= :now)', { now })
      .andWhere('r.minQuantity <= :qty', { qty: quantity })
      .andWhere(
        '(r.scope = \'ALL_PRODUCTS\'' +
          ' OR (r.scope = \'CATEGORY\' AND r.scopeCategoryId = :catId)' +
          ' OR (r.scope = \'BRAND\' AND r.scopeBrandId = :brandId)' +
          ' OR (r.scope = \'PRODUCT\' AND r.scopeProductId = :productId))',
        {
          catId: product.categoryId,
          brandId: product.brandId,
          productId: product.id,
        },
      )
      .orderBy('r.priority', 'DESC')
      .getMany();

    // CLEARANCE rules only apply to products tagged 'clearance'
    return rules.filter((r) => {
      if (r.ruleType === 'CLEARANCE') {
        return product.tags?.includes('clearance') ?? false;
      }
      return true;
    });
  }

  async validatePromoCode(code: string, cartContext: CartContext): Promise<PromoCode> {
    const upperCode = code.toUpperCase();
    const promo = await this.promoRepo.findOne({
      where: { code: upperCode },
    });

    if (!promo) throw new PromoCodeInvalidException('Code not found');
    if (!promo.isActive) throw new PromoCodeInvalidException('Code is inactive');

    const now = new Date();
    if (promo.validFrom && promo.validFrom > now) {
      throw new PromoCodeInvalidException('Code is not yet valid');
    }
    if (promo.validUntil && promo.validUntil < now) {
      throw new PromoCodeInvalidException('Code has expired');
    }
    if (promo.maxUsesTotal !== null && promo.currentUses >= promo.maxUsesTotal) {
      throw new PromoCodeInvalidException('Code usage limit reached');
    }

    if (promo.applyScope === 'PRODUCT' && promo.scopeProductId) {
      const item = cartContext.items.find((i) => i.productId === promo.scopeProductId);
      if (!item) throw new PromoCodeInvalidException('Code does not apply to items in cart');
      if (item.quantity < promo.minQuantity) {
        throw new PromoCodeInvalidException(
          `Minimum quantity of ${promo.minQuantity} required for this code`,
        );
      }
    }

    if (promo.applyScope === 'CATEGORY' && promo.scopeCategoryId) {
      // Category scope validation would require loading products; skip deep check here
      // The service caller is responsible for pre-loading product data
    }

    if (promo.minOrderValue !== null && cartContext.orderTotal < promo.minOrderValue) {
      throw new PromoCodeInvalidException(
        `Minimum order value of Q${promo.minOrderValue} required`,
      );
    }

    return promo;
  }

  async calculateProductPrice(
    product: Product,
    quantity: number,
    customerType: 'registered' | 'guest',
    promoCode?: string,
  ): Promise<PriceBreakdown> {
    const basePrice = Number(product.salePrice ?? 0);
    const floor = Number(product.distributorPrice ?? 0);

    const rules = await this.getApplicableRules(product, quantity);

    // For guests, skip TRADE_TIER rules
    const eligibleRules = customerType === 'guest'
      ? rules.filter((r) => r.ruleType !== 'TRADE_TIER')
      : rules;

    // Apply rules: if none are stackable, use only the highest-priority rule
    const stackable = eligibleRules.filter((r) => r.isStackable);
    const nonStackable = eligibleRules.filter((r) => !r.isStackable);
    const topNonStackable = nonStackable.length > 0 ? [nonStackable[0]] : [];
    const rulesToApply = [...topNonStackable, ...stackable];

    const appliedRules: AppliedRule[] = [];
    let priceAfterRules = basePrice;

    for (const rule of rulesToApply) {
      const saved =
        rule.discountType === 'PERCENTAGE'
          ? priceAfterRules * (Number(rule.discountValue) / 100)
          : Number(rule.discountValue);
      priceAfterRules = Math.max(priceAfterRules - saved, floor);
      appliedRules.push({
        ruleId: rule.id,
        name: rule.name,
        discountType: rule.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
        discountValue: Number(rule.discountValue),
        amountSaved: saved,
      });
    }

    let priceAfterPromo = priceAfterRules;
    let isFreeDelivery = false;
    let appliedPromoCode: AppliedPromo | null = null;

    if (promoCode) {
      try {
        const cartContext: CartContext = {
          items: [{ productId: product.id, quantity }],
          orderTotal: priceAfterRules * quantity,
        };
        const promo = await this.validatePromoCode(promoCode, cartContext);

        if (promo.discountType === 'FREE_DELIVERY') {
          isFreeDelivery = true;
          appliedPromoCode = {
            code: promo.code,
            description: promo.description,
            discountType: 'FREE_DELIVERY',
            discountValue: null,
            amountSaved: 0,
          };
        } else {
          const promoApplies =
            promo.applyScope === 'CART' ||
            (promo.applyScope === 'PRODUCT' && promo.scopeProductId === product.id);

          if (promoApplies) {
            const saved =
              promo.discountType === 'PERCENTAGE'
                ? priceAfterRules * (Number(promo.discountValue ?? 0) / 100)
                : Number(promo.discountValue ?? 0);
            priceAfterPromo = Math.max(priceAfterRules - saved, floor);
            appliedPromoCode = {
              code: promo.code,
              description: promo.description,
              discountType: promo.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
              discountValue: Number(promo.discountValue),
              amountSaved: saved,
            };
          }
        }
      } catch {
        // Invalid promo — proceed without it
      }
    }

    return {
      productId: product.id,
      sku: product.sku,
      basePrice,
      priceAfterRules,
      priceAfterPromo,
      totalSavings: basePrice - priceAfterPromo,
      isFreeDelivery,
      appliedRules,
      appliedPromoCode,
    };
  }

  async findAllRules(): Promise<PriceRule[]> {
    return this.ruleRepo.find({ order: { priority: 'DESC', createdAt: 'DESC' } });
  }

  async createRule(data: Partial<PriceRule>): Promise<PriceRule> {
    const rule = this.ruleRepo.create(data);
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: string, data: Partial<PriceRule>): Promise<PriceRule> {
    await this.ruleRepo.update(id, data);
    return this.ruleRepo.findOneOrFail({ where: { id } });
  }

  async deactivateRule(id: string): Promise<void> {
    await this.ruleRepo.update(id, { isActive: false });
  }

  async findAllPromoCodes(): Promise<PromoCode[]> {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createPromoCode(data: Partial<PromoCode>): Promise<PromoCode> {
    const promo = this.promoRepo.create({
      ...data,
      code: (data.code as string).toUpperCase(),
    });
    return this.promoRepo.save(promo);
  }

  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    if (data.code) {
      (data as any).code = data.code.toUpperCase();
    }
    await this.promoRepo.update(id, data);
    return this.promoRepo.findOneOrFail({ where: { id } });
  }

  async deactivatePromoCode(id: string): Promise<void> {
    await this.promoRepo.update(id, { isActive: false });
  }
}
