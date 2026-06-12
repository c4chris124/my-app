import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from '../../src/brands/brands.service.js';
import { DeleteBrandDto } from '../../src/brands/dtos/delete-brand.dto.js';
import { GetBrandDto } from '../../src/brands/dtos/get-brand.dto.js';
import { Brand } from '../../src/brands/entities/brand.entity.js';
import {
  BrandsFindRepository,
  PaginatedResult,
} from '../../src/brands/repository/brands-find.repository.js';
import { BrandsCreateRepository } from '../../src/brands/repository/brands-create.repository.js';
import { BrandsDeleteRepository } from '../../src/brands/repository/brands-delete.repository.js';
import { BrandsUpdateRepository } from '../../src/brands/repository/brands-update.repository.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BRAND_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OTHER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockBrand = {
  id: BRAND_ID,
  name: 'COOKMATE',
  slug: 'cookmate',
  description: 'Commercial kitchen equipment',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  products: [],
  priceRules: [],
} as Brand;

const makeCreateDto = (overrides = {}) => ({
  name: 'COOKMATE',
  description: 'Commercial kitchen equipment',
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  description: 'Updated description',
  ...overrides,
});

const makePaginatedResult = (
  brands: Brand[],
  page = 1,
  limit = 20,
): PaginatedResult<Brand> => ({
  data: brands,
  total: brands.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('BrandsService', () => {
  let service: BrandsService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findById: jest.Mock;
  let findBySlug: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findById = jest.fn();
    findBySlug = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: BrandsFindRepository,
          useValue: { findAll, findById, findBySlug },
        },
        { provide: BrandsCreateRepository, useValue: { create } },
        { provide: BrandsUpdateRepository, useValue: { update } },
        { provide: BrandsDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the paginated result from findRepo', async () => {
      const query: GetBrandDto = { page: 1, limit: 20 };
      const result = makePaginatedResult([mockBrand]);
      findAll.mockResolvedValue(result);

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledTimes(1);
      expect(findAll).toHaveBeenCalledWith(query);
      expect(response).toEqual(result);
    });

    it('passes search filter through to findRepo unchanged', async () => {
      const query: GetBrandDto = { search: 'cook', page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockBrand]));

      await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
    });

    it('returns an empty page when no records match', async () => {
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll({ search: 'nonexistent' });

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('returns multiple records with correct pagination metadata', async () => {
      const secondBrand = {
        ...mockBrand,
        id: OTHER_ID,
        name: 'HORNOMAX',
        slug: 'hornomax',
      } as Brand;
      const result: PaginatedResult<Brand> = {
        data: [mockBrand, secondBrand],
        total: 8,
        page: 2,
        limit: 5,
      };
      findAll.mockResolvedValue(result);

      const response = await service.findAll({ page: 2, limit: 5 });

      expect(response.total).toBe(8);
      expect(response.page).toBe(2);
      expect(response.limit).toBe(5);
      expect(response.data).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the brand when found', async () => {
      findById.mockResolvedValue(mockBrand);

      const result = await service.findOne(BRAND_ID);

      expect(findById).toHaveBeenCalledTimes(1);
      expect(findById).toHaveBeenCalledWith(BRAND_ID);
      expect(result).toEqual(mockBrand);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Brand with id ${BRAND_ID} not found`),
      );

      await expect(service.findOne(BRAND_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(BRAND_ID)).rejects.toThrow(
        `Brand with id ${BRAND_ID} not found`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------

  describe('findBySlug', () => {
    it('returns the brand when the slug exists', async () => {
      findBySlug.mockResolvedValue(mockBrand);

      const result = await service.findBySlug('cookmate');

      expect(findBySlug).toHaveBeenCalledWith('cookmate');
      expect(result).toEqual(mockBrand);
    });

    it('throws NotFoundException when the repo returns null', async () => {
      findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        "Brand with slug 'missing-slug' not found",
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created brand on success', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockBrand);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockBrand);
    });

    it('propagates ConflictException when a duplicate name is detected', async () => {
      const dto = makeCreateDto({ name: 'COOKMATE' });
      create.mockRejectedValue(
        new ConflictException("Brand with name 'COOKMATE' already exists"),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        "Brand with name 'COOKMATE' already exists",
      );
    });

    it('does not call find, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockBrand);

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
    it('returns the updated brand on success', async () => {
      const dto = makeUpdateDto();
      const updated = {
        ...mockBrand,
        description: 'Updated description',
      } as Brand;
      update.mockResolvedValue(updated);

      const result = await service.update(BRAND_ID, dto);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(BRAND_ID, dto);
      expect(result).toEqual(updated);
    });

    it('updates only the supplied fields (PATCH semantics)', async () => {
      const updated = {
        ...mockBrand,
        description: 'Updated description',
      } as Brand;
      update.mockResolvedValue(updated);

      const result = await service.update(BRAND_ID, makeUpdateDto());

      expect(result.description).toBe('Updated description');
      expect(result.name).toBe(mockBrand.name);
      expect(result.slug).toBe(mockBrand.slug);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Brand with id ${BRAND_ID} not found`),
      );

      await expect(service.update(BRAND_ID, makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates ConflictException when the new name collides with another record', async () => {
      const dto = makeUpdateDto({ name: 'HORNOMAX' });
      update.mockRejectedValue(
        new ConflictException("Brand with name 'HORNOMAX' already exists"),
      );

      await expect(service.update(BRAND_ID, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeleteBrandDto = {
        id: BRAND_ID,
        message: 'Brand deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(BRAND_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(BRAND_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Brand with id ${BRAND_ID} not found`),
      );

      await expect(service.remove(BRAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('does not call find, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: BRAND_ID,
        message: 'Brand deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(BRAND_ID);

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
