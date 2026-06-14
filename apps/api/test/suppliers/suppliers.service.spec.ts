import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSupplierDto } from '../../src/suppliers/dtos/delete-supplier.dto.js';
import { GetSupplierDto } from '../../src/suppliers/dtos/get-supplier.dto.js';
import { Supplier } from '../../src/suppliers/entities/supplier.entity.js';
import {
  PaginatedResult,
  SuppliersFindRepository,
} from '../../src/suppliers/repository/suppliers-find.repository.js';
import { SuppliersCreateRepository } from '../../src/suppliers/repository/suppliers-create.repository.js';
import { SuppliersDeleteRepository } from '../../src/suppliers/repository/suppliers-delete.repository.js';
import { SuppliersUpdateRepository } from '../../src/suppliers/repository/suppliers-update.repository.js';
import { SuppliersService } from '../../src/suppliers/suppliers.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SUPPLIER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OTHER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockSupplier = {
  id: SUPPLIER_ID,
  name: 'TECNOPAN',
  slug: 'tecnopan',
  contactEmail: 'ventas@tecnopan.com.gt',
  contactPhone: '+502 5555 1234',
  country: 'Guatemala',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  products: [],
} as Supplier;

const makeCreateDto = (overrides = {}) => ({
  name: 'TECNOPAN',
  contactEmail: 'ventas@tecnopan.com.gt',
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  contactPhone: '+502 5555 9999',
  ...overrides,
});

const makePaginatedResult = (
  suppliers: Supplier[],
  page = 1,
  limit = 20,
): PaginatedResult<Supplier> => ({
  data: suppliers,
  total: suppliers.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SuppliersService', () => {
  let service: SuppliersService;

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
        SuppliersService,
        {
          provide: SuppliersFindRepository,
          useValue: { findAll, findById, findBySlug },
        },
        { provide: SuppliersCreateRepository, useValue: { create } },
        { provide: SuppliersUpdateRepository, useValue: { update } },
        { provide: SuppliersDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the paginated result from findRepo', async () => {
      const query: GetSupplierDto = { page: 1, limit: 20 };
      const result = makePaginatedResult([mockSupplier]);
      findAll.mockResolvedValue(result);

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledTimes(1);
      expect(findAll).toHaveBeenCalledWith(query);
      expect(response).toEqual(result);
    });

    it('passes search filter through to findRepo unchanged', async () => {
      const query: GetSupplierDto = { search: 'tecno', page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockSupplier]));

      await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
    });

    it('returns an empty page when no records match', async () => {
      const query: GetSupplierDto = { search: 'nonexistent' };
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll(query);

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('returns multiple records with correct pagination metadata', async () => {
      const secondSupplier = {
        ...mockSupplier,
        id: OTHER_ID,
        name: 'IMPORTADORA GT',
        slug: 'importadora-gt',
      } as Supplier;
      const result: PaginatedResult<Supplier> = {
        data: [mockSupplier, secondSupplier],
        total: 12,
        page: 2,
        limit: 10,
      };
      findAll.mockResolvedValue(result);

      const response = await service.findAll({ page: 2, limit: 10 });

      expect(response.total).toBe(12);
      expect(response.page).toBe(2);
      expect(response.limit).toBe(10);
      expect(response.data).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the supplier when found', async () => {
      findById.mockResolvedValue(mockSupplier);

      const result = await service.findOne(SUPPLIER_ID);

      expect(findById).toHaveBeenCalledTimes(1);
      expect(findById).toHaveBeenCalledWith(SUPPLIER_ID);
      expect(result).toEqual(mockSupplier);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Supplier with id ${SUPPLIER_ID} not found`),
      );

      await expect(service.findOne(SUPPLIER_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(SUPPLIER_ID)).rejects.toThrow(
        `Supplier with id ${SUPPLIER_ID} not found`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------

  describe('findBySlug', () => {
    it('returns the supplier when the slug exists', async () => {
      findBySlug.mockResolvedValue(mockSupplier);

      const result = await service.findBySlug('tecnopan');

      expect(findBySlug).toHaveBeenCalledWith('tecnopan');
      expect(result).toEqual(mockSupplier);
    });

    it('throws NotFoundException when the repo returns null', async () => {
      findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        "Supplier with slug 'missing-slug' not found",
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created supplier on success', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockSupplier);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockSupplier);
    });

    it('propagates ConflictException when a duplicate name is detected', async () => {
      const dto = makeCreateDto({ name: 'TECNOPAN' });
      create.mockRejectedValue(
        new ConflictException("Supplier with name 'TECNOPAN' already exists"),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        "Supplier with name 'TECNOPAN' already exists",
      );
    });

    it('does not call find, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockSupplier);

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
    it('returns the updated supplier on success', async () => {
      const dto = makeUpdateDto();
      const updated = {
        ...mockSupplier,
        contactPhone: '+502 5555 9999',
      } as Supplier;
      update.mockResolvedValue(updated);

      const result = await service.update(SUPPLIER_ID, dto);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(SUPPLIER_ID, dto);
      expect(result).toEqual(updated);
    });

    it('updates only the supplied fields (PATCH semantics)', async () => {
      const updated = {
        ...mockSupplier,
        contactPhone: '+502 5555 9999',
      } as Supplier;
      update.mockResolvedValue(updated);

      const result = await service.update(SUPPLIER_ID, makeUpdateDto());

      expect(result.contactPhone).toBe('+502 5555 9999');
      expect(result.name).toBe(mockSupplier.name);
      expect(result.country).toBe(mockSupplier.country);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Supplier with id ${SUPPLIER_ID} not found`),
      );

      await expect(
        service.update(SUPPLIER_ID, makeUpdateDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates ConflictException when the new name collides with another record', async () => {
      const dto = makeUpdateDto({ name: 'IMPORTADORA GT' });
      update.mockRejectedValue(
        new ConflictException(
          "Supplier with name 'IMPORTADORA GT' already exists",
        ),
      );

      await expect(service.update(SUPPLIER_ID, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeleteSupplierDto = {
        id: SUPPLIER_ID,
        message: 'Supplier deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(SUPPLIER_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(SUPPLIER_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Supplier with id ${SUPPLIER_ID} not found`),
      );

      await expect(service.remove(SUPPLIER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not call find, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: SUPPLIER_ID,
        message: 'Supplier deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(SUPPLIER_ID);

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
