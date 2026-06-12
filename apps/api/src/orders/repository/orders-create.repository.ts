import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  FulfillmentStatus,
  OrderStatusKind,
  PaymentStatus,
  UserRole,
  UserStatus,
} from '@myapp/shared';
import { Order } from '../entities/order.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { OrderStatusHistory } from '../entities/order-status-history.entity.js';
import { CheckoutDto } from '../dtos/checkout.dto.js';
import {
  isOrderNumberUniqueViolation,
  nextOrderNumber,
} from '../order-number.helpers.js';
import { OrdersFindRepository } from './orders-find.repository.js';
import { CartsFindRepository } from '../../carts/repository/carts-find.repository.js';
import { CartsDeleteRepository } from '../../carts/repository/carts-delete.repository.js';
import { ProductsFindRepository } from '../../products/repository/products-find.repository.js';
import { UsersService } from '../../users/users.service.js';
import {
  EngineLine,
  PricingEngineService,
} from '../../pricing/pricing-engine.service.js';
import { Cart } from '../../carts/entities/cart.entity.js';
import { User } from '../../users/entities/user.entity.js';

const roundMoney = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

interface SnapshotLines {
  orderItems: OrderItem[];
  engineLines: EngineLine[]; // index-aligned with orderItems
}

@Injectable()
export class OrdersCreateRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ordersFindRepository: OrdersFindRepository,
    private readonly cartsFindRepository: CartsFindRepository,
    private readonly cartsDeleteRepository: CartsDeleteRepository,
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly usersService: UsersService,
    private readonly pricingEngineService: PricingEngineService,
  ) {}

  async checkout(input: CheckoutDto & { customerId: string }): Promise<Order> {
    try {
      return await this.runCheckout(input);
    } catch (error) {
      // rare race: a concurrent checkout grabbed the same order number —
      // re-run the whole transaction once with a fresh counter
      if (isOrderNumberUniqueViolation(error)) {
        return this.runCheckout(input);
      }
      throw error;
    }
  }

  private async runCheckout(
    input: CheckoutDto & { customerId: string },
  ): Promise<Order> {
    const customer = await this.loadEligibleCustomer(input.customerId);

    const cart = await this.cartsFindRepository.findActiveByCustomer(
      input.customerId,
    );
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const savedOrderId = await this.dataSource.transaction(async (manager) => {
      const { orderItems, engineLines } = await this.snapshotCartLines(
        manager,
        cart,
      );

      // ── PRICING ENGINE (rules + promo, same math as /pricing/preview) ──
      // The eligibility guard above guarantees an ACTIVE CUSTOMER, so the
      // checkout customerType is always 'registered'.
      const breakdown = await this.pricingEngineService.computeForCheckout(
        engineLines,
        'registered',
        input.customerId,
        input.promoCode,
        manager,
      );

      // A typed promo the engine rejected fails the checkout — never place
      // the order silently at full price.
      if (input.promoCode && breakdown.promoRejectedReason) {
        throw new BadRequestException(
          `Promo code not applicable: ${breakdown.promoRejectedReason}`,
        );
      }

      // Freeze the engine's per-line results onto the snapshots.
      breakdown.lines.forEach((breakdownLine, index) => {
        orderItems[index].discountAmount =
          breakdownLine.discountAmount.toFixed(2);
        orderItems[index].lineTotal = breakdownLine.lineTotal.toFixed(2);
      });

      const subtotal = breakdown.subtotal;
      const discountTotal = breakdown.discountTotal;
      const total = roundMoney(subtotal - discountTotal);
      const totalItems = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const orderNumber = nextOrderNumber(
        await this.ordersFindRepository.findMaxOrderCounter(),
      );

      const historyRepository = manager.getRepository(OrderStatusHistory);
      const newOrder = manager.getRepository(Order).create({
        orderNumber,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        fulfillmentStatus: FulfillmentStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: subtotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        total: total.toFixed(2),
        totalItems,
        appliedPromoCodeId: breakdown.appliedPromo?.id ?? null,
        notes: input.notes ?? null,
        items: orderItems,
        statusHistory: [
          historyRepository.create({
            statusKind: OrderStatusKind.FULFILLMENT,
            fromStatus: null,
            toStatus: FulfillmentStatus.PENDING,
          }),
          historyRepository.create({
            statusKind: OrderStatusKind.PAYMENT,
            fromStatus: null,
            toStatus: PaymentStatus.UNPAID,
          }),
        ],
      });

      // cascade inserts items + history
      const savedOrder = await manager.getRepository(Order).save(newOrder);

      // Promo applied → record the redemption + guarded currentUses
      // increment, inside this same transaction. A ConflictException here
      // (global cap hit concurrently) rolls the whole checkout back.
      if (breakdown.appliedPromo) {
        await this.pricingEngineService.recordRedemption(
          {
            promoCodeId: breakdown.appliedPromo.id,
            orderId: savedOrder.id,
            customerId: input.customerId,
            discountAmount: breakdown.promoDiscountTotal,
            isFreeDelivery: breakdown.isFreeDelivery,
          },
          manager,
        );
      }

      // same transaction: the cart flips inactive only if the order commits
      await this.cartsDeleteRepository.deactivate(cart.id, manager);

      return savedOrder.id;
    });

    return this.ordersFindRepository.findById(savedOrderId);
  }

  private async loadEligibleCustomer(customerId: string): Promise<User> {
    const customer = await this.usersService.findById(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with id ${customerId} not found`);
    }
    if (
      customer.role !== UserRole.CUSTOMER ||
      customer.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Order customer must be an active CUSTOMER account',
      );
    }
    return customer;
  }

  /**
   * Re-validates each product and freezes its price/name/sku into a line,
   * alongside the index-aligned EngineLine the pricing engine consumes.
   */
  private async snapshotCartLines(
    manager: EntityManager,
    cart: Cart,
  ): Promise<SnapshotLines> {
    const orderItemRepository = manager.getRepository(OrderItem);
    const orderItems: OrderItem[] = [];
    const engineLines: EngineLine[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productsFindRepository
        .findById(cartItem.productId)
        .catch((error: unknown) => {
          if (error instanceof NotFoundException) {
            throw new BadRequestException(
              `Cart references a non-existent product (${cartItem.productId})`,
            );
          }
          throw error;
        });

      if (!product.isActive) {
        throw new BadRequestException(
          `Product ${product.sku} is inactive and cannot be ordered`,
        );
      }
      if (product.salePrice === null) {
        throw new BadRequestException(
          `Product ${product.sku} has no sale price and cannot be ordered`,
        );
      }

      const unitPrice = Number(product.salePrice);
      const lineTotal = roundMoney(unitPrice * cartItem.quantity);

      orderItems.push(
        orderItemRepository.create({
          productId: product.id,
          skuSnapshot: product.sku,
          nameSnapshot: product.name,
          unitPrice: unitPrice.toFixed(2),
          quantity: cartItem.quantity,
          discountAmount: '0.00',
          lineTotal: lineTotal.toFixed(2),
        }),
      );
      engineLines.push({
        productId: product.id,
        name: product.name,
        unitPrice,
        distributorPrice: Number(product.distributorPrice ?? 0),
        quantity: cartItem.quantity,
        categoryId: product.categoryId,
        brandId: product.brandId,
        tags: product.tags ?? [],
      });
    }

    return { orderItems, engineLines };
  }
}
