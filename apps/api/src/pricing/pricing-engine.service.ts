import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  PriceRuleType,
  PromoApplyScope,
  UserRole,
  UserStatus,
} from '@myapp/shared';
import { PriceRulesFindRepository } from './repository/price-rules-find.repository.js';
import { PromoCodesFindRepository } from './repository/promo-codes-find.repository.js';
import { PromoCodesUpdateRepository } from './repository/promo-codes-update.repository.js';
import { ProductsFindRepository } from '../products/repository/products-find.repository.js';
import { RedemptionsFindRepository } from '../redemptions/repository/redemptions-find.repository.js';
import { RedemptionsCreateRepository } from '../redemptions/repository/redemptions-create.repository.js';
import { CartsFindRepository } from '../carts/repository/carts-find.repository.js';
import { UsersService } from '../users/users.service.js';
import { PriceRule } from './entities/price-rule.entity.js';
import { PromoCode } from './entities/promo-code.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { PreviewCartDto } from './dtos/preview-cart.dto.js';
import {
  BreakdownAppliedRuleDto,
  PriceBreakdownResponseDto,
  PromoRejectionReason,
} from './dtos/price-breakdown.dto.js';

export type CustomerType = 'registered' | 'guest';

export interface EngineLine {
  productId: string;
  name: string;
  unitPrice: number; // live salePrice (preview) or snapshot unitPrice (checkout)
  distributorPrice: number; // cost floor
  quantity: number;
  categoryId: string;
  brandId: string;
  tags: string[];
}

export interface RecordRedemptionParams {
  promoCodeId: string;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
  isFreeDelivery: boolean;
}

/** Round half-up to 2 decimals at every stored monetary boundary. */
const roundMoney = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

interface RuleContribution {
  rule: PriceRule;
  unitSaved: number;
}

// Per-line working state threaded through the pricing steps.
interface WorkingLine {
  line: EngineLine;
  floorTotal: number; // distributorPrice * qty — final total never below this
  lineSubtotal: number; // unitPrice * qty, before any discount
  lineAfterRules: number; // post-rule amount (cost floor applied)
  contributions: RuleContribution[]; // rules that actually contributed
  contributionExclusive: boolean; // true when a single non-stackable rule won
  finalTotal: number;
  ruleDiscount: number;
  promoDiscount: number;
}

/**
 * The pricing calculation core. Preview and checkout both run the SAME
 * computePricing() so the previewed total always equals the charged total.
 *
 * Worked example:
 *   base unit Q1,000, qty 2, Trade Tier −8% (registered, stackable)
 *     → ruleUnit Q920, line after rules Q1,840 (rule discount Q160)
 *   SPRING26 −10% CART stacks on the post-rule amount
 *     → promo −Q184, line total Q1,656
 *   distributorPrice Q700 → floor Q1,400 not breached. Totals:
 *     subtotal Q2,000, ruleDiscountTotal Q160, promoDiscountTotal Q184,
 *     discountTotal Q344, total Q1,656.
 *
 * Reads only — the single writing method is recordRedemption(), called by
 * checkout after the order row exists, inside checkout's transaction.
 */
@Injectable()
export class PricingEngineService {
  constructor(
    private readonly priceRulesFindRepository: PriceRulesFindRepository,
    private readonly promoCodesFindRepository: PromoCodesFindRepository,
    private readonly promoCodesUpdateRepository: PromoCodesUpdateRepository,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly redemptionsFindRepository: RedemptionsFindRepository,
    private readonly redemptionsCreateRepository: RedemptionsCreateRepository,
    private readonly cartsFindRepository: CartsFindRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * PUBLIC PREVIEW — pure read. No redemption recorded, currentUses
   * untouched. A rejected promo is reported via promoRejectedReason, not an
   * error, so the storefront can render it inline.
   */
  async previewCart(input: PreviewCartDto): Promise<PriceBreakdownResponseDto> {
    const hasItems = (input.items?.length ?? 0) > 0;
    const hasCartId = input.cartId !== undefined;
    if (hasItems === hasCartId) {
      throw new BadRequestException(
        'Provide exactly one of items or cartId to preview pricing',
      );
    }

    const lines = hasCartId
      ? await this.resolveCartLines(input.cartId as string)
      : await this.resolveItemLines(
          input.items as Array<{ productId: string; quantity: number }>,
        );

    const { customerType, customerId } = await this.resolveCustomer(
      input.customerId,
    );

    return this.computePricing({
      lines,
      customerType,
      customerId,
      promoCode: input.promoCode,
    });
  }

  /**
   * CHECKOUT COMPUTE — same core, transaction-aware reads, still NO writes.
   * Called by checkout BEFORE the order row is saved.
   */
  computeForCheckout(
    lines: EngineLine[],
    customerType: CustomerType,
    customerId: string | null,
    promoCode: string | undefined,
    manager: EntityManager,
  ): Promise<PriceBreakdownResponseDto> {
    return this.computePricing(
      { lines, customerType, customerId, promoCode },
      manager,
    );
  }

  /**
   * CHECKOUT RECORD — the engine's only writing method. Called AFTER the
   * order is saved (so orderId exists), inside the SAME transaction:
   * inserts the redemption row, then atomically increments the promo's
   * currentUses with a guarded UPDATE. Zero affected rows means the global
   * cap was hit concurrently → ConflictException rolls the checkout back.
   */
  async recordRedemption(
    input: RecordRedemptionParams,
    manager: EntityManager,
  ): Promise<void> {
    await this.redemptionsCreateRepository.record(input, manager);

    const affectedRows = await this.promoCodesUpdateRepository.incrementUses(
      input.promoCodeId,
      manager,
    );
    if (affectedRows === 0) {
      throw new ConflictException('Promo code usage limit reached');
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Calculation core (no writes)
  // ──────────────────────────────────────────────────────────────────────

  private async computePricing(
    input: {
      lines: EngineLine[];
      customerType: CustomerType;
      customerId: string | null;
      promoCode?: string;
    },
    manager?: EntityManager,
  ): Promise<PriceBreakdownResponseDto> {
    const rawSubtotal = roundMoney(
      input.lines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      ),
    );

    // Step 1 — per-line automatic price rules.
    const workingLines: WorkingLine[] = [];
    for (const line of input.lines) {
      workingLines.push(
        await this.applyRulesToLine(line, input.customerType, rawSubtotal),
      );
    }

    const totalAfterRules = roundMoney(
      workingLines.reduce((sum, wl) => sum + wl.lineAfterRules, 0),
    );

    // Step 2 — promo code (optional).
    let appliedPromo: PriceBreakdownResponseDto['appliedPromo'] = null;
    let promoRejectedReason: PromoRejectionReason | undefined;
    let isFreeDelivery = false;

    if (input.promoCode !== undefined && input.promoCode.trim() !== '') {
      const promo = await this.promoCodesFindRepository.findByCode(
        input.promoCode,
      );
      promoRejectedReason = await this.validatePromo(
        promo,
        input.customerId,
        workingLines,
        totalAfterRules,
        manager,
      );

      if (!promoRejectedReason && promo) {
        const targetLines = this.selectTargetLines(promo, workingLines);
        if (promo.discountType === 'FREE_DELIVERY') {
          isFreeDelivery = true;
        } else {
          this.applyPromoToTargets(promo, targetLines);
        }
        appliedPromo = {
          id: promo.id,
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          amountSaved: roundMoney(
            workingLines.reduce((sum, wl) => sum + wl.promoDiscount, 0),
          ),
        };
      }
    }

    // Step 3 — assemble the breakdown.
    const subtotal = roundMoney(
      workingLines.reduce((sum, wl) => sum + wl.lineSubtotal, 0),
    );
    const ruleDiscountTotal = roundMoney(
      workingLines.reduce((sum, wl) => sum + wl.ruleDiscount, 0),
    );
    const promoDiscountTotal = roundMoney(
      workingLines.reduce((sum, wl) => sum + wl.promoDiscount, 0),
    );
    const total = roundMoney(
      workingLines.reduce((sum, wl) => sum + wl.finalTotal, 0),
    );

    return {
      currency: 'GTQ',
      subtotal,
      ruleDiscountTotal,
      promoDiscountTotal,
      discountTotal: roundMoney(ruleDiscountTotal + promoDiscountTotal),
      total,
      isFreeDelivery,
      lines: workingLines.map((wl) => ({
        productId: wl.line.productId,
        name: wl.line.name,
        unitPrice: wl.line.unitPrice,
        quantity: wl.line.quantity,
        appliedRules: wl.contributions.map(
          (contribution): BreakdownAppliedRuleDto => ({
            id: contribution.rule.id,
            name: contribution.rule.name,
            ruleType: contribution.rule.ruleType,
            amountSaved: roundMoney(contribution.unitSaved * wl.line.quantity),
          }),
        ),
        discountAmount: roundMoney(wl.lineSubtotal - wl.finalTotal),
        lineTotal: wl.finalTotal,
      })),
      appliedPromo,
      ...(promoRejectedReason ? { promoRejectedReason } : {}),
    };
  }

  private async applyRulesToLine(
    line: EngineLine,
    customerType: CustomerType,
    orderTotal: number,
  ): Promise<WorkingLine> {
    const base = line.unitPrice;
    const candidates = await this.priceRulesFindRepository.findApplicableRules({
      productId: line.productId,
      categoryId: line.categoryId,
      brandId: line.brandId,
      quantity: line.quantity,
      orderTotal,
    });

    const eligibleRules = candidates.filter((rule) => {
      // CLEARANCE rules only reach lines whose product is tagged 'clearance'.
      if (
        rule.ruleType === PriceRuleType.CLEARANCE &&
        !line.tags.includes('clearance')
      ) {
        return false;
      }
      // TRADE_TIER pricing is for registered customers only.
      if (
        rule.ruleType === PriceRuleType.TRADE_TIER &&
        customerType !== 'registered'
      ) {
        return false;
      }
      return true;
    });

    const contributions: RuleContribution[] = eligibleRules.map((rule) => ({
      rule,
      unitSaved: roundMoney(
        rule.discountType === 'PERCENTAGE'
          ? (base * Number(rule.discountValue)) / 100
          : Number(rule.discountValue),
      ),
    }));

    // Stackable rules add together; non-stackable rules stand alone.
    // Whichever path discounts more wins.
    const stackable = contributions.filter((c) => c.rule.isStackable);
    const nonStackable = contributions.filter((c) => !c.rule.isStackable);
    const combinedStackable = roundMoney(
      stackable.reduce((sum, c) => sum + c.unitSaved, 0),
    );
    const bestExclusive = nonStackable.reduce<RuleContribution | null>(
      (best, c) => (best === null || c.unitSaved > best.unitSaved ? c : best),
      null,
    );

    let contributing: RuleContribution[];
    let contributionExclusive = false;
    if (bestExclusive && bestExclusive.unitSaved > combinedStackable) {
      contributing = [bestExclusive];
      contributionExclusive = true;
    } else {
      contributing = combinedStackable > 0 ? stackable : [];
    }

    const ruleDiscountUnit = Math.max(
      bestExclusive?.unitSaved ?? 0,
      combinedStackable,
    );
    const ruleUnitPrice = roundMoney(
      Math.max(base - ruleDiscountUnit, line.distributorPrice),
    );

    // If the cost floor capped the discount, scale the per-rule savings so
    // the reported amounts still sum to what was actually discounted.
    const effectiveUnitDiscount = roundMoney(base - ruleUnitPrice);
    if (ruleDiscountUnit > 0 && effectiveUnitDiscount < ruleDiscountUnit) {
      const capFactor = effectiveUnitDiscount / ruleDiscountUnit;
      contributing = contributing.map((c) => ({
        rule: c.rule,
        unitSaved: roundMoney(c.unitSaved * capFactor),
      }));
    }

    const lineSubtotal = roundMoney(base * line.quantity);
    const lineAfterRules = roundMoney(ruleUnitPrice * line.quantity);

    return {
      line,
      floorTotal: roundMoney(line.distributorPrice * line.quantity),
      lineSubtotal,
      lineAfterRules,
      contributions: contributing,
      contributionExclusive,
      finalTotal: lineAfterRules,
      ruleDiscount: roundMoney(lineSubtotal - lineAfterRules),
      promoDiscount: 0,
    };
  }

  /** Same state checks as PromoCodesService.validate, plus cart-context ones. */
  private async validatePromo(
    promo: PromoCode | null,
    customerId: string | null,
    workingLines: WorkingLine[],
    totalAfterRules: number,
    manager?: EntityManager,
  ): Promise<PromoRejectionReason | undefined> {
    if (!promo) return 'NOT_FOUND';
    if (!promo.isActive) return 'INACTIVE';

    const now = new Date();
    if (promo.validFrom !== null && promo.validFrom > now) {
      return 'NOT_YET_VALID';
    }
    if (promo.validUntil !== null && promo.validUntil < now) {
      return 'EXPIRED';
    }
    if (
      promo.maxUsesTotal !== null &&
      promo.currentUses >= promo.maxUsesTotal
    ) {
      return 'USAGE_LIMIT_REACHED';
    }

    // Per-customer limit (guests without a customerId skip this check).
    if (customerId) {
      const usedCount =
        await this.redemptionsFindRepository.countByPromoAndCustomer(
          promo.id,
          customerId,
          manager,
        );
      if (usedCount >= promo.maxUsesPerCustomer) {
        return 'PER_CUSTOMER_LIMIT_REACHED';
      }
    }

    const targetLines = this.selectTargetLines(promo, workingLines);
    if (targetLines.length === 0) {
      return 'SCOPE_NOT_IN_CART';
    }

    const targetQuantity = targetLines.reduce(
      (sum, wl) => sum + wl.line.quantity,
      0,
    );
    if (targetQuantity < promo.minQuantity) {
      return 'MIN_NOT_MET';
    }
    if (
      promo.minOrderValue !== null &&
      totalAfterRules < Number(promo.minOrderValue)
    ) {
      return 'MIN_NOT_MET';
    }

    return undefined;
  }

  private selectTargetLines(
    promo: PromoCode,
    workingLines: WorkingLine[],
  ): WorkingLine[] {
    switch (promo.applyScope) {
      case PromoApplyScope.PRODUCT:
        return workingLines.filter(
          (wl) => wl.line.productId === promo.scopeProductId,
        );
      case PromoApplyScope.CATEGORY:
        return workingLines.filter(
          (wl) => wl.line.categoryId === promo.scopeCategoryId,
        );
      case PromoApplyScope.CART:
      default:
        return workingLines;
    }
  }

  /**
   * Applies a PERCENTAGE / FIXED_AMOUNT promo to the target lines, mutating
   * each WorkingLine's finalTotal / ruleDiscount / promoDiscount.
   *
   * Stacking decision per line: when the contributing rule was non-stackable
   * (exclusive), the promo does NOT stack with it — the line takes whichever
   * is cheaper of (a) rules-only or (b) promo-on-base-ignoring-rules. When
   * the contributing rules were stackable (or the line had none), the promo
   * stacks on top of the post-rule amount. The cost floor is re-applied
   * after the promo on every path.
   */
  private applyPromoToTargets(
    promo: PromoCode,
    targetLines: WorkingLine[],
  ): void {
    const promoValue = Number(promo.discountValue ?? 0);
    const isFixedAmount = promo.discountType === 'FIXED_AMOUNT';

    // FIXED_AMOUNT is an order-level cap: allocate it across target lines
    // proportionally (remainder to the last line so allocations sum exactly).
    const poolStacked = roundMoney(
      targetLines.reduce((sum, wl) => sum + wl.lineAfterRules, 0),
    );
    const poolBase = roundMoney(
      targetLines.reduce((sum, wl) => sum + wl.lineSubtotal, 0),
    );
    const cappedStacked = isFixedAmount ? Math.min(promoValue, poolStacked) : 0;
    const cappedBase = isFixedAmount ? Math.min(promoValue, poolBase) : 0;

    let allocatedStacked = 0;
    let allocatedBase = 0;

    targetLines.forEach((wl, index) => {
      const isLastLine = index === targetLines.length - 1;

      let discountOnStacked: number;
      let discountOnBase: number;
      if (isFixedAmount) {
        discountOnStacked = isLastLine
          ? roundMoney(Math.max(cappedStacked - allocatedStacked, 0))
          : roundMoney(
              poolStacked > 0
                ? (cappedStacked * wl.lineAfterRules) / poolStacked
                : 0,
            );
        discountOnBase = isLastLine
          ? roundMoney(Math.max(cappedBase - allocatedBase, 0))
          : roundMoney(
              poolBase > 0 ? (cappedBase * wl.lineSubtotal) / poolBase : 0,
            );
        allocatedStacked = roundMoney(allocatedStacked + discountOnStacked);
        allocatedBase = roundMoney(allocatedBase + discountOnBase);
      } else {
        discountOnStacked = roundMoney((wl.lineAfterRules * promoValue) / 100);
        discountOnBase = roundMoney((wl.lineSubtotal * promoValue) / 100);
      }

      const stackedFinal = Math.max(
        roundMoney(wl.lineAfterRules - discountOnStacked),
        wl.floorTotal,
      );
      const promoOnlyFinal = Math.max(
        roundMoney(wl.lineSubtotal - discountOnBase),
        wl.floorTotal,
      );
      const rulesOnlyFinal = wl.lineAfterRules;

      if (wl.contributionExclusive) {
        if (promoOnlyFinal < rulesOnlyFinal) {
          // Promo beats the exclusive rule: the rule is forfeited entirely.
          wl.finalTotal = promoOnlyFinal;
          wl.ruleDiscount = 0;
          wl.contributions = [];
          wl.promoDiscount = roundMoney(wl.lineSubtotal - promoOnlyFinal);
        }
        // else: rules-only stands; promo contributes nothing to this line.
      } else {
        wl.finalTotal = stackedFinal;
        wl.promoDiscount = roundMoney(rulesOnlyFinal - stackedFinal);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Preview input resolution
  // ──────────────────────────────────────────────────────────────────────

  private async resolveItemLines(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<EngineLine[]> {
    const lines: EngineLine[] = [];
    for (const item of items) {
      const product = await this.productsFindRepository
        .findById(item.productId)
        .catch((error: unknown) => {
          if (error instanceof NotFoundException) {
            throw new BadRequestException(
              `productId references a non-existent product (${item.productId})`,
            );
          }
          throw error;
        });
      lines.push(this.toEngineLine(product, item.quantity));
    }
    return lines;
  }

  private async resolveCartLines(cartId: string): Promise<EngineLine[]> {
    const cart = await this.cartsFindRepository.findById(cartId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    return cart.items.map((cartItem) =>
      this.toEngineLine(cartItem.product, cartItem.quantity),
    );
  }

  private toEngineLine(product: Product, quantity: number): EngineLine {
    if (!product.isActive) {
      throw new BadRequestException(
        `Product ${product.sku} is inactive and cannot be priced`,
      );
    }
    if (product.salePrice === null) {
      throw new BadRequestException(
        `Product ${product.sku} has no sale price and cannot be priced`,
      );
    }
    return {
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.salePrice),
      distributorPrice: Number(product.distributorPrice ?? 0),
      quantity,
      categoryId: product.categoryId,
      brandId: product.brandId,
      tags: product.tags ?? [],
    };
  }

  /** registered ⇔ customerId resolves to an ACTIVE User with role CUSTOMER. */
  private async resolveCustomer(
    customerId: string | undefined,
  ): Promise<{ customerType: CustomerType; customerId: string | null }> {
    if (!customerId) {
      return { customerType: 'guest', customerId: null };
    }
    const user = await this.usersService.findById(customerId);
    const isRegisteredCustomer =
      user !== null &&
      user.role === UserRole.CUSTOMER &&
      user.status === UserStatus.ACTIVE;
    return isRegisteredCustomer
      ? { customerType: 'registered', customerId }
      : { customerType: 'guest', customerId: null };
  }
}
