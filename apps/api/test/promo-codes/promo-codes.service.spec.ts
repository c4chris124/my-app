import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PromoApplyScope } from '@myapp/shared';
import { DeletePromoCodeDto } from '../../src/pricing/dtos/delete-promo-code.dto.js';
import { GetPromoCodeDto } from '../../src/pricing/dtos/get-promo-code.dto.js';
import { PromoCode } from '../../src/pricing/entities/promo-code.entity.js';
import {
  PaginatedResult,
  PromoCodesFindRepository,
} from '../../src/pricing/repository/promo-codes-find.repository.js';
import { PromoCodesCreateRepository } from '../../src/pricing/repository/promo-codes-create.repository.js';
import { PromoCodesDeleteRepository } from '../../src/pricing/repository/promo-codes-delete.repository.js';
import { PromoCodesUpdateRepository } from '../../src/pricing/repository/promo-codes-update.repository.js';
import { PromoCodesService } from '../../src/pricing/promo-codes.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PROMO_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const DAY_MS = 24 * 60 * 60 * 1000;
const yesterday = () => new Date(Date.now() - DAY_MS);
const tomorrow = () => new Date(Date.now() + DAY_MS);

// Entity shape: decimals are strings (pg driver). Valid and active by default.
const makePromo = (overrides: Partial<PromoCode> = {}): PromoCode =>
  ({
    id: PROMO_ID,
    code: 'SPRING26',
    description: 'Spring fit-out campaign',
    discountType: 'PERCENTAGE',
    discountValue: '10.00',
    applyScope: PromoApplyScope.CART,
    scopeProductId: null,
    scopeProduct: null,
    scopeCategoryId: null,
    scopeCategory: null,
    minQuantity: 1,
    minOrderValue: null,
    maxUsesTotal: 100,
    maxUsesPerCustomer: 1,
    currentUses: 0,
    isActive: true,
    validFrom: null,
    validUntil: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    redemptions: [],
    ...overrides,
  }) as PromoCode;

const makeCreateDto = (overrides = {}) => ({
  code: 'SPRING26',
  description: 'Spring fit-out campaign',
  discountType: 'PERCENTAGE' as const,
  discountValue: 10,
  applyScope: PromoApplyScope.CART,
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  description: 'Updated campaign description',
  ...overrides,
});

const makePaginatedResult = (
  promoCodes: PromoCode[],
  page = 1,
  limit = 20,
): PaginatedResult<PromoCode> => ({
  data: promoCodes,
  total: promoCodes.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PromoCodesService', () => {
  let service: PromoCodesService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findById: jest.Mock;
  let findByCode: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findById = jest.fn();
    findByCode = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        {
          provide: PromoCodesFindRepository,
          useValue: { findAll, findById, findByCode },
        },
        { provide: PromoCodesCreateRepository, useValue: { create } },
        { provide: PromoCodesUpdateRepository, useValue: { update } },
        { provide: PromoCodesDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(PromoCodesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — maps entities to PromoCodeResponseDto
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the page mapped through PromoCodeResponseDto', async () => {
      const query: GetPromoCodeDto = { page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([makePromo()]));

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
      expect(response.total).toBe(1);
      expect(response.data[0].code).toBe('SPRING26');
    });

    it('converts decimal strings to numbers in the response', async () => {
      findAll.mockResolvedValue(
        makePaginatedResult([makePromo({ minOrderValue: '2500.00' })]),
      );

      const response = await service.findAll({});

      expect(response.data[0].discountValue).toBe(10);
      expect(response.data[0].minOrderValue).toBe(2500);
    });

    it('keeps discountValue null for FREE_DELIVERY promos', async () => {
      findAll.mockResolvedValue(
        makePaginatedResult([
          makePromo({ discountType: 'FREE_DELIVERY', discountValue: null }),
        ]),
      );

      const response = await service.findAll({});

      expect(response.data[0].discountType).toBe('FREE_DELIVERY');
      expect(response.data[0].discountValue).toBeNull();
    });

    it('returns an empty page when no records match', async () => {
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll({ search: 'nonexistent' });

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });

  // -------------------------------------------------------------------------
  // findOne / findByCode
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the mapped promo when found', async () => {
      findById.mockResolvedValue(makePromo());

      const result = await service.findOne(PROMO_ID);

      expect(findById).toHaveBeenCalledWith(PROMO_ID);
      expect(result.id).toBe(PROMO_ID);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Promo code with id ${PROMO_ID} not found`),
      );

      await expect(service.findOne(PROMO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCode', () => {
    it('returns the mapped promo when the code exists', async () => {
      findByCode.mockResolvedValue(makePromo());

      const result = await service.findByCode('spring26');

      expect(findByCode).toHaveBeenCalledWith('spring26');
      expect(result.code).toBe('SPRING26');
    });

    it('throws NotFoundException when the repo returns null', async () => {
      findByCode.mockResolvedValue(null);

      await expect(service.findByCode('MISSING')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByCode('MISSING')).rejects.toThrow(
        "Promo code 'MISSING' not found",
      );
    });
  });

  // -------------------------------------------------------------------------
  // create / update / remove
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created promo mapped to the response DTO', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(makePromo());

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledWith(dto);
      expect(result.code).toBe('SPRING26');
      expect(result.discountValue).toBe(10);
    });

    it('propagates ConflictException when the code already exists', async () => {
      create.mockRejectedValue(
        new ConflictException('Promo code already exists'),
      );

      await expect(service.create(makeCreateDto())).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('returns the updated promo mapped to the response DTO', async () => {
      const dto = makeUpdateDto();
      update.mockResolvedValue(
        makePromo({ description: 'Updated campaign description' }),
      );

      const result = await service.update(PROMO_ID, dto);

      expect(update).toHaveBeenCalledWith(PROMO_ID, dto);
      expect(result.description).toBe('Updated campaign description');
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Promo code with id ${PROMO_ID} not found`),
      );

      await expect(service.update(PROMO_ID, makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeletePromoCodeDto = {
        id: PROMO_ID,
        message: 'Promo code deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(PROMO_ID);

      expect(deactivate).toHaveBeenCalledWith(PROMO_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Promo code with id ${PROMO_ID} not found`),
      );

      await expect(service.remove(PROMO_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // validate — the read-only state machine (real service logic)
  // -------------------------------------------------------------------------

  describe('validate', () => {
    it('returns valid with the mapped promo for an active in-window code', async () => {
      findByCode.mockResolvedValue(
        makePromo({ validFrom: yesterday(), validUntil: tomorrow() }),
      );

      const result = await service.validate({ code: 'SPRING26' });

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.promoCode?.code).toBe('SPRING26');
    });

    it('returns NOT_FOUND when the code does not exist', async () => {
      findByCode.mockResolvedValue(null);

      const result = await service.validate({ code: 'MISSING' });

      expect(result).toEqual({ valid: false, reason: 'NOT_FOUND' });
    });

    it('returns INACTIVE for a deactivated code', async () => {
      findByCode.mockResolvedValue(makePromo({ isActive: false }));

      const result = await service.validate({ code: 'WINTER25' });

      expect(result).toEqual({ valid: false, reason: 'INACTIVE' });
    });

    it('returns NOT_YET_VALID when validFrom is in the future', async () => {
      findByCode.mockResolvedValue(makePromo({ validFrom: tomorrow() }));

      const result = await service.validate({ code: 'SPRING26' });

      expect(result).toEqual({ valid: false, reason: 'NOT_YET_VALID' });
    });

    it('returns EXPIRED when validUntil is in the past', async () => {
      findByCode.mockResolvedValue(makePromo({ validUntil: yesterday() }));

      const result = await service.validate({ code: 'SPRING26' });

      expect(result).toEqual({ valid: false, reason: 'EXPIRED' });
    });

    it('returns USAGE_LIMIT_REACHED when currentUses hits maxUsesTotal', async () => {
      findByCode.mockResolvedValue(
        makePromo({ maxUsesTotal: 100, currentUses: 100 }),
      );

      const result = await service.validate({ code: 'SPRING26' });

      expect(result).toEqual({ valid: false, reason: 'USAGE_LIMIT_REACHED' });
    });

    it('treats a null maxUsesTotal as unlimited', async () => {
      findByCode.mockResolvedValue(
        makePromo({ maxUsesTotal: null, currentUses: 99999 }),
      );

      const result = await service.validate({ code: 'SPRING26' });

      expect(result.valid).toBe(true);
    });

    it('performs no writes during validation', async () => {
      findByCode.mockResolvedValue(makePromo());

      await service.validate({ code: 'SPRING26' });

      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(deactivate).not.toHaveBeenCalled();
    });
  });
});
