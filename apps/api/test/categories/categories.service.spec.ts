import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../../src/categories/categories.service.js';
import { DeleteCategoryDto } from '../../src/categories/dtos/delete-category.dto.js';
import { Category } from '../../src/categories/entities/category.entity.js';
import {
  CategoriesFindRepository,
  CategoryTreeNode,
  PaginatedResult,
} from '../../src/categories/repository/categories-find.repository.js';
import { CategoriesCreateRepository } from '../../src/categories/repository/categories-create.repository.js';
import { CategoriesDeleteRepository } from '../../src/categories/repository/categories-delete.repository.js';
import { CategoriesUpdateRepository } from '../../src/categories/repository/categories-update.repository.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CATEGORY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CHILD_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockCategory = {
  id: CATEGORY_ID,
  name: 'Estufas e Inducción',
  slug: 'estufas-e-induccion',
  description: 'Estufas industriales y cocinas de inducción',
  imageUrl: null,
  parentId: null,
  parent: null,
  children: [],
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  products: [],
  priceRules: [],
  promoCodes: [],
} as Category;

const makeCreateDto = (overrides = {}) => ({
  name: 'Estufas e Inducción',
  description: 'Estufas industriales y cocinas de inducción',
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  sortOrder: 5,
  ...overrides,
});

const makePaginatedResult = (
  categories: Category[],
  page = 1,
  limit = 20,
): PaginatedResult<Category> => ({
  data: categories,
  total: categories.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CategoriesService', () => {
  let service: CategoriesService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findTree: jest.Mock;
  let findAllFlat: jest.Mock;
  let findById: jest.Mock;
  let findBySlug: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findTree = jest.fn();
    findAllFlat = jest.fn();
    findById = jest.fn();
    findBySlug = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesFindRepository,
          useValue: { findTree, findAllFlat, findById, findBySlug },
        },
        { provide: CategoriesCreateRepository, useValue: { create } },
        { provide: CategoriesUpdateRepository, useValue: { update } },
        { provide: CategoriesDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — tree vs flat branching
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the tree by default (tree not specified)', async () => {
      const tree: CategoryTreeNode[] = [
        {
          id: CATEGORY_ID,
          name: 'Estufas e Inducción',
          slug: 'estufas-e-induccion',
          children: [],
        } as unknown as CategoryTreeNode,
      ];
      findTree.mockResolvedValue(tree);

      const response = await service.findAll({});

      expect(findTree).toHaveBeenCalledTimes(1);
      expect(findAllFlat).not.toHaveBeenCalled();
      expect(response).toEqual(tree);
    });

    it('returns the tree when tree=true is requested explicitly', async () => {
      findTree.mockResolvedValue([]);

      await service.findAll({ tree: true });

      expect(findTree).toHaveBeenCalledTimes(1);
      expect(findAllFlat).not.toHaveBeenCalled();
    });

    it('returns the flat paginated list when tree=false', async () => {
      const query = { tree: false, page: 1, limit: 20 };
      const result = makePaginatedResult([mockCategory]);
      findAllFlat.mockResolvedValue(result);

      const response = await service.findAll(query);

      expect(findAllFlat).toHaveBeenCalledTimes(1);
      expect(findAllFlat).toHaveBeenCalledWith(query);
      expect(findTree).not.toHaveBeenCalled();
      expect(response).toEqual(result);
    });

    it('passes flat-list filters through to findAllFlat unchanged', async () => {
      const query = { tree: false, search: 'estufa', page: 2, limit: 10 };
      findAllFlat.mockResolvedValue(makePaginatedResult([], 2, 10));

      await service.findAll(query);

      expect(findAllFlat).toHaveBeenCalledWith(query);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns the category when found', async () => {
      findById.mockResolvedValue(mockCategory);

      const result = await service.findOne(CATEGORY_ID);

      expect(findById).toHaveBeenCalledTimes(1);
      expect(findById).toHaveBeenCalledWith(CATEGORY_ID);
      expect(result).toEqual(mockCategory);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Category with id ${CATEGORY_ID} not found`),
      );

      await expect(service.findOne(CATEGORY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------

  describe('findBySlug', () => {
    it('returns the category when the slug exists', async () => {
      findBySlug.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('estufas-e-induccion');

      expect(findBySlug).toHaveBeenCalledWith('estufas-e-induccion');
      expect(result).toEqual(mockCategory);
    });

    it('throws NotFoundException when the repo returns null', async () => {
      findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('missing-slug')).rejects.toThrow(
        "Category with slug 'missing-slug' not found",
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created category on success', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockCategory);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCategory);
    });

    it('passes parentId through for child categories', async () => {
      const dto = makeCreateDto({ name: 'Inducción', parentId: CATEGORY_ID });
      const child = {
        ...mockCategory,
        id: CHILD_ID,
        name: 'Inducción',
        parentId: CATEGORY_ID,
      } as Category;
      create.mockResolvedValue(child);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledWith(dto);
      expect(result.parentId).toBe(CATEGORY_ID);
    });

    it('propagates ConflictException when a duplicate name is detected', async () => {
      create.mockRejectedValue(
        new ConflictException(
          "Category with name 'Estufas e Inducción' already exists",
        ),
      );

      await expect(service.create(makeCreateDto())).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not call find, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockCategory);

      await service.create(makeCreateDto());

      expect(findTree).not.toHaveBeenCalled();
      expect(findAllFlat).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(deactivate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('returns the updated category on success', async () => {
      const dto = makeUpdateDto();
      const updated = { ...mockCategory, sortOrder: 5 } as Category;
      update.mockResolvedValue(updated);

      const result = await service.update(CATEGORY_ID, dto);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(CATEGORY_ID, dto);
      expect(result).toEqual(updated);
    });

    it('updates only the supplied fields (PATCH semantics)', async () => {
      const updated = { ...mockCategory, sortOrder: 5 } as Category;
      update.mockResolvedValue(updated);

      const result = await service.update(CATEGORY_ID, makeUpdateDto());

      expect(result.sortOrder).toBe(5);
      expect(result.name).toBe(mockCategory.name);
      expect(result.slug).toBe(mockCategory.slug);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Category with id ${CATEGORY_ID} not found`),
      );

      await expect(
        service.update(CATEGORY_ID, makeUpdateDto()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeleteCategoryDto = {
        id: CATEGORY_ID,
        message: 'Category deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(CATEGORY_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(CATEGORY_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Category with id ${CATEGORY_ID} not found`),
      );

      await expect(service.remove(CATEGORY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not call find, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: CATEGORY_ID,
        message: 'Category deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(CATEGORY_ID);

      expect(findTree).not.toHaveBeenCalled();
      expect(findAllFlat).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
