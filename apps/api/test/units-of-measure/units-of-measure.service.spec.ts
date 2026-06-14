import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUnitOfMeasureDto } from '../../src/units-of-measure/dtos/delete-unit-of-measure.dto.js';
import { GetUnitOfMeasureDto } from '../../src/units-of-measure/dtos/get-unit-of-measure.dto.js';
import { UnitOfMeasure } from '../../src/units-of-measure/entities/unit-of-measure.entity.js';
import {
  PaginatedResult,
  UnitsMeasureFindRepository,
} from '../../src/units-of-measure/repository/units-mesure-find.repository.js';
import { UnitsMeasureCreateRepository } from '../../src/units-of-measure/repository/units-mesure-create.repository.js';
import { UnitsMeasureDeleteRepository } from '../../src/units-of-measure/repository/units-mesure-delete.repository.js';
import { UnitsMeasureUpdateRepository } from '../../src/units-of-measure/repository/units-mesure-update.repository.js';
import { UnitsOfMeasureService } from '../../src/units-of-measure/units-of-measure.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const UNIT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OTHER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockUnit: UnitOfMeasure = {
  id: UNIT_ID,
  name: 'Libras',
  abbreviation: 'lbs',
  type: 'weight',
  isActive: true,
  products: [],
};

const makeCreateDto = (overrides = {}) => ({
  name: 'Libras',
  abbreviation: 'lbs',
  type: 'weight' as const,
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  abbreviation: 'LB',
  ...overrides,
});

const makePaginatedResult = (
  units: UnitOfMeasure[],
  page = 1,
  limit = 20,
): PaginatedResult<UnitOfMeasure> => ({
  data: units,
  total: units.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('UnitsOfMeasureService', () => {
  let service: UnitsOfMeasureService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findById: jest.Mock;
  let findByName: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findById = jest.fn();
    findByName = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsOfMeasureService,
        {
          provide: UnitsMeasureFindRepository,
          useValue: { findAll, findById, findByName },
        },
        {
          provide: UnitsMeasureCreateRepository,
          useValue: { create },
        },
        {
          provide: UnitsMeasureUpdateRepository,
          useValue: { update },
        },
        {
          provide: UnitsMeasureDeleteRepository,
          useValue: { deactivate },
        },
      ],
    }).compile();

    service = module.get(UnitsOfMeasureService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the paginated result from findRepo', async () => {
      const query: GetUnitOfMeasureDto = { page: 1, limit: 20 };
      const result = makePaginatedResult([mockUnit]);
      findAll.mockResolvedValue(result);

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledTimes(1);
      expect(findAll).toHaveBeenCalledWith(query);
      expect(response).toEqual(result);
    });

    it('passes type filter through to findRepo unchanged', async () => {
      const query: GetUnitOfMeasureDto = { type: 'weight', page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockUnit]));

      await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
    });

    it('passes search filter through to findRepo unchanged', async () => {
      const query: GetUnitOfMeasureDto = { search: 'lib', page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockUnit]));

      await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
    });

    it('returns an empty page when no records match', async () => {
      const query: GetUnitOfMeasureDto = { search: 'nonexistent' };
      findAll.mockResolvedValue(makePaginatedResult([]));

      const response = await service.findAll(query);

      expect(response).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('returns multiple records with correct pagination metadata', async () => {
      const secondUnit: UnitOfMeasure = {
        ...mockUnit,
        id: OTHER_ID,
        name: 'Kilogramos',
        abbreviation: 'kg',
      };
      const query: GetUnitOfMeasureDto = { page: 2, limit: 10 };
      const result: PaginatedResult<UnitOfMeasure> = {
        data: [mockUnit, secondUnit],
        total: 12,
        page: 2,
        limit: 10,
      };
      findAll.mockResolvedValue(result);

      const response = await service.findAll(query);

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
    it('returns the unit when found', async () => {
      findById.mockResolvedValue(mockUnit);

      const result = await service.findOne(UNIT_ID);

      expect(findById).toHaveBeenCalledTimes(1);
      expect(findById).toHaveBeenCalledWith(UNIT_ID);
      expect(result).toEqual(mockUnit);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Unit of measure with id ${UNIT_ID} not found`),
      );

      await expect(service.findOne(UNIT_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(UNIT_ID)).rejects.toThrow(
        `Unit of measure with id ${UNIT_ID} not found`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created unit on success', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockUnit);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUnit);
    });

    it('propagates ConflictException when a duplicate name is detected', async () => {
      const dto = makeCreateDto({ name: 'Libras' });
      create.mockRejectedValue(
        new ConflictException(
          "Unit of measure with name 'Libras' already exists",
        ),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        "Unit of measure with name 'Libras' already exists",
      );
    });

    it('does not call findAll, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockUnit);

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
    it('returns the updated unit on success', async () => {
      const dto = makeUpdateDto();
      const updated: UnitOfMeasure = { ...mockUnit, abbreviation: 'LB' };
      update.mockResolvedValue(updated);

      const result = await service.update(UNIT_ID, dto);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(UNIT_ID, dto);
      expect(result).toEqual(updated);
    });

    it('updates only the supplied fields (PATCH semantics)', async () => {
      const dto = makeUpdateDto({ abbreviation: 'LB' });
      const updated: UnitOfMeasure = { ...mockUnit, abbreviation: 'LB' };
      update.mockResolvedValue(updated);

      const result = await service.update(UNIT_ID, dto);

      expect(result.abbreviation).toBe('LB');
      expect(result.name).toBe(mockUnit.name);
      expect(result.type).toBe(mockUnit.type);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Unit of measure with id ${UNIT_ID} not found`),
      );

      await expect(service.update(UNIT_ID, makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates ConflictException when the new name collides with another record', async () => {
      const dto = makeUpdateDto({ name: 'Kilogramos' });
      update.mockRejectedValue(
        new ConflictException(
          "Unit of measure with name 'Kilogramos' already exists",
        ),
      );

      await expect(service.update(UNIT_ID, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(UNIT_ID, dto)).rejects.toThrow(
        "Unit of measure with name 'Kilogramos' already exists",
      );
    });

    it('does not call findAll, create, or deactivate during update', async () => {
      update.mockResolvedValue({ ...mockUnit, ...makeUpdateDto() });

      await service.update(UNIT_ID, makeUpdateDto());

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(deactivate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deactivatedAt = new Date('2026-06-07T12:00:00.000Z');
      const deleteResponse: DeleteUnitOfMeasureDto = {
        id: UNIT_ID,
        message: 'Unit of measure deactivated successfully',
        deactivatedAt,
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(UNIT_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(UNIT_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('response contains the correct id, message, and a Date timestamp', async () => {
      const deleteResponse: DeleteUnitOfMeasureDto = {
        id: UNIT_ID,
        message: 'Unit of measure deactivated successfully',
        deactivatedAt: new Date(),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(UNIT_ID);

      expect(result.id).toBe(UNIT_ID);
      expect(result.message).toBe('Unit of measure deactivated successfully');
      expect(result.deactivatedAt).toBeInstanceOf(Date);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Unit of measure with id ${UNIT_ID} not found`),
      );

      await expect(service.remove(UNIT_ID)).rejects.toThrow(NotFoundException);
      await expect(service.remove(UNIT_ID)).rejects.toThrow(
        `Unit of measure with id ${UNIT_ID} not found`,
      );
    });

    it('does not call findAll, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: UNIT_ID,
        message: 'Unit of measure deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(UNIT_ID);

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
