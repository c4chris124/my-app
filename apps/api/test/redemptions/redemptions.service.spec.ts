import { Test, TestingModule } from '@nestjs/testing';
import { GetRedemptionDto } from '../../src/redemptions/dtos/get-redemption.dto.js';
import { PromoCodeRedemption } from '../../src/redemptions/entities/promo-code-redemption.entity.js';
import {
  PaginatedResult,
  RedemptionsFindRepository,
} from '../../src/redemptions/repository/redemptions-find.repository.js';
import { RedemptionsService } from '../../src/redemptions/redemptions.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const REDEMPTION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const PROMO_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const ORDER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const CUSTOMER_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';

// Entity shape: discountAmount is a decimal string (pg driver); relations
// loaded the way RedemptionsFindRepository joins them for reporting.
const mockRedemption = {
  id: REDEMPTION_ID,
  promoCodeId: PROMO_ID,
  promoCode: { id: PROMO_ID, code: 'SPRING26' },
  orderId: ORDER_ID,
  order: { id: ORDER_ID, orderNumber: 'ORD-2041' },
  customerId: CUSTOMER_ID,
  customer: { id: CUSTOMER_ID, name: 'Grupo Sabores' },
  discountAmount: '184.00',
  isFreeDelivery: false,
  appliedAt: new Date('2026-06-10T15:30:00.000Z'),
} as unknown as PromoCodeRedemption;

const makePaginatedResult = (
  redemptions: PromoCodeRedemption[],
  page = 1,
  limit = 20,
): PaginatedResult<PromoCodeRedemption> => ({
  data: redemptions,
  total: redemptions.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RedemptionsService', () => {
  let service: RedemptionsService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findByOrder: jest.Mock;
  let countByPromoAndCustomer: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findByOrder = jest.fn();
    countByPromoAndCustomer = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedemptionsService,
        {
          provide: RedemptionsFindRepository,
          useValue: { findAll, findByOrder, countByPromoAndCustomer },
        },
      ],
    }).compile();

    service = module.get(RedemptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — paginated report mapped to RedemptionResponseDto
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the page mapped through RedemptionResponseDto', async () => {
      const query: GetRedemptionDto = { page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockRedemption]));

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledTimes(1);
      expect(findAll).toHaveBeenCalledWith(query);
      expect(response.total).toBe(1);
      expect(response.data[0].id).toBe(REDEMPTION_ID);
    });

    it('flattens promo code, order number, and customer name', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockRedemption]));

      const response = await service.findAll({});
      const redemptionResponse = response.data[0];

      expect(redemptionResponse.code).toBe('SPRING26');
      expect(redemptionResponse.orderNumber).toBe('ORD-2041');
      expect(redemptionResponse.customerName).toBe('Grupo Sabores');
      expect(redemptionResponse.customerId).toBe(CUSTOMER_ID);
    });

    it('converts the discountAmount decimal string to a number', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockRedemption]));

      const response = await service.findAll({});

      expect(response.data[0].discountAmount).toBe(184);
    });

    it('handles SET NULL order/customer references gracefully', async () => {
      const orphanedRedemption = {
        ...mockRedemption,
        orderId: null,
        order: null,
        customerId: null,
        customer: null,
      } as unknown as PromoCodeRedemption;
      findAll.mockResolvedValue(makePaginatedResult([orphanedRedemption]));

      const response = await service.findAll({});
      const redemptionResponse = response.data[0];

      expect(redemptionResponse.orderId).toBeNull();
      expect(redemptionResponse.orderNumber).toBeNull();
      expect(redemptionResponse.customerId).toBeNull();
      expect(redemptionResponse.customerName).toBeNull();
    });

    it('passes report filters through to findRepo unchanged', async () => {
      const query: GetRedemptionDto = {
        promoCodeId: PROMO_ID,
        customerId: CUSTOMER_ID,
        appliedFrom: '2026-06-01T00:00:00Z',
        page: 1,
        limit: 20,
      };
      findAll.mockResolvedValue(makePaginatedResult([]));

      await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
    });

    it('returns an empty page when no records match', async () => {
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll({});

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });

  // -------------------------------------------------------------------------
  // findByOrder
  // -------------------------------------------------------------------------

  describe('findByOrder', () => {
    it('returns the mapped redemptions for one order', async () => {
      findByOrder.mockResolvedValue([mockRedemption]);

      const result = await service.findByOrder(ORDER_ID);

      expect(findByOrder).toHaveBeenCalledTimes(1);
      expect(findByOrder).toHaveBeenCalledWith(ORDER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe('ORD-2041');
      expect(result[0].discountAmount).toBe(184);
    });

    it('returns an empty array for an order without redemptions', async () => {
      findByOrder.mockResolvedValue([]);

      const result = await service.findByOrder(ORDER_ID);

      expect(result).toEqual([]);
    });

    it('marks free-delivery redemptions in the response', async () => {
      const freeDeliveryRedemption = {
        ...mockRedemption,
        discountAmount: '0.00',
        isFreeDelivery: true,
      } as unknown as PromoCodeRedemption;
      findByOrder.mockResolvedValue([freeDeliveryRedemption]);

      const result = await service.findByOrder(ORDER_ID);

      expect(result[0].isFreeDelivery).toBe(true);
      expect(result[0].discountAmount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Immutability — redemptions are append-only financial records
  // -------------------------------------------------------------------------

  describe('immutability', () => {
    it('exposes no create, update, or remove methods', () => {
      const serviceAsRecord = service as unknown as Record<string, unknown>;

      expect(serviceAsRecord.create).toBeUndefined();
      expect(serviceAsRecord.update).toBeUndefined();
      expect(serviceAsRecord.remove).toBeUndefined();
      expect(serviceAsRecord.delete).toBeUndefined();
    });
  });
});
