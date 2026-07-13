import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PriceRuleScope, PriceRuleType } from '@myapp/shared';
import { DeletePriceRuleDto } from '../../src/pricing/dtos/delete-price-rule.dto.js';
import { GetPriceRuleDto } from '../../src/pricing/dtos/get-price-rule.dto.js';
import { PriceRule } from '../../src/pricing/entities/price-rule.entity.js';
import {
  PaginatedResult,
  PriceRulesFindRepository,
} from '../../src/pricing/repository/price-rules-find.repository.js';
import { PriceRulesCreateRepository } from '../../src/pricing/repository/price-rules-create.repository.js';
import { PriceRulesDeleteRepository } from '../../src/pricing/repository/price-rules-delete.repository.js';
import { PriceRulesUpdateRepository } from '../../src/pricing/repository/price-rules-update.repository.js';
import { PriceRulesService } from '../../src/pricing/price-rules.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const RULE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const BRAND_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

// Entity shape: decimals are strings (pg driver), scope relations nullable.
const mockRule = {
  id: RULE_ID,
  name: 'Volume 10+',
  description: 'Volume discount for 10 or more units',
  ruleType: PriceRuleType.VOLUME,
  scope: PriceRuleScope.ALL_PRODUCTS,
  scopeCategoryId: null,
  scopeCategory: null,
  scopeBrandId: null,
  scopeBrand: null,
  scopeProductId: null,
  scopeProduct: null,
  discountType: 'PERCENTAGE',
  discountValue: '12.00',
  minQuantity: 10,
  minOrderValue: null,
  priority: 20,
  isStackable: false,
  isActive: true,
  validFrom: null,
  validUntil: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as PriceRule;

const makeCreateDto = (overrides = {}) => ({
  name: 'Volume 10+',
  ruleType: PriceRuleType.VOLUME,
  scope: PriceRuleScope.ALL_PRODUCTS,
  discountType: 'PERCENTAGE' as const,
  discountValue: 12,
  minQuantity: 10,
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  discountValue: 15,
  ...overrides,
});

const makePaginatedResult = (
  rules: PriceRule[],
  page = 1,
  limit = 20,
): PaginatedResult<PriceRule> => ({
  data: rules,
  total: rules.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PriceRulesService', () => {
  let service: PriceRulesService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findById: jest.Mock;
  let findApplicableRules: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findById = jest.fn();
    findApplicableRules = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceRulesService,
        {
          provide: PriceRulesFindRepository,
          useValue: { findAll, findById, findApplicableRules },
        },
        { provide: PriceRulesCreateRepository, useValue: { create } },
        { provide: PriceRulesUpdateRepository, useValue: { update } },
        { provide: PriceRulesDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(PriceRulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — maps entities to PriceRuleResponseDto
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the page mapped through PriceRuleResponseDto', async () => {
      const query: GetPriceRuleDto = { page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockRule]));

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
      expect(response.total).toBe(1);
      expect(response.data[0].id).toBe(RULE_ID);
      expect(response.data[0].name).toBe('Volume 10+');
    });

    it('converts decimal strings to numbers in the response', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockRule]));

      const response = await service.findAll({});

      expect(response.data[0].discountValue).toBe(12);
      expect(response.data[0].minOrderValue).toBeNull();
    });

    it('flattens a populated scope relation to an id + name ref', async () => {
      const brandScopedRule = {
        ...mockRule,
        scope: PriceRuleScope.BRAND,
        scopeBrandId: BRAND_ID,
        scopeBrand: { id: BRAND_ID, name: 'COOKMATE' },
      } as PriceRule;
      findAll.mockResolvedValue(makePaginatedResult([brandScopedRule]));

      const response = await service.findAll({});

      expect(response.data[0].scopeBrand).toEqual({
        id: BRAND_ID,
        name: 'COOKMATE',
      });
      expect(response.data[0].scopeCategory).toBeNull();
      expect(response.data[0].scopeProduct).toBeNull();
    });

    it('returns an empty page when no records match', async () => {
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll({ search: 'nonexistent' });

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the mapped rule when found', async () => {
      findById.mockResolvedValue(mockRule);

      const result = await service.findOne(RULE_ID);

      expect(findById).toHaveBeenCalledWith(RULE_ID);
      expect(result.id).toBe(RULE_ID);
      expect(result.discountValue).toBe(12);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Price rule with id ${RULE_ID} not found`),
      );

      await expect(service.findOne(RULE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created rule mapped to the response DTO', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockRule);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result.ruleType).toBe(PriceRuleType.VOLUME);
      expect(result.discountValue).toBe(12);
    });

    it('propagates BadRequestException when cross-field consistency fails', async () => {
      create.mockRejectedValue(
        new BadRequestException('scopeBrandId is required when scope is BRAND'),
      );

      await expect(service.create(makeCreateDto())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not call find, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockRule);

      await service.create(makeCreateDto());

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(deactivate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('returns the updated rule mapped to the response DTO', async () => {
      const dto = makeUpdateDto();
      const updated = { ...mockRule, discountValue: '15.00' } as PriceRule;
      update.mockResolvedValue(updated);

      const result = await service.update(RULE_ID, dto);

      expect(update).toHaveBeenCalledWith(RULE_ID, dto);
      expect(result.discountValue).toBe(15);
      expect(result.name).toBe(mockRule.name);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Price rule with id ${RULE_ID} not found`),
      );

      await expect(service.update(RULE_ID, makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates BadRequestException when a partial update breaks consistency', async () => {
      update.mockRejectedValue(
        new BadRequestException(
          'discountValue cannot exceed 100 when discountType is PERCENTAGE',
        ),
      );

      await expect(
        service.update(RULE_ID, makeUpdateDto({ discountValue: 150 })),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeletePriceRuleDto = {
        id: RULE_ID,
        message: 'Price rule deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(RULE_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(RULE_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Price rule with id ${RULE_ID} not found`),
      );

      await expect(service.remove(RULE_ID)).rejects.toThrow(NotFoundException);
    });

    it('does not call find, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: RULE_ID,
        message: 'Price rule deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(RULE_ID);

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
