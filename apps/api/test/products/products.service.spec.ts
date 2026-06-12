import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesWeighting } from '@myapp/shared';
import { DeleteProductDto } from '../../src/products/dtos/delete-product.dto.js';
import { GetProductDto } from '../../src/products/dtos/get-product.dto.js';
import { Product } from '../../src/products/entities/product.entity.js';
import {
  PaginatedResult,
  ProductsFindRepository,
} from '../../src/products/repository/products-find.repository.js';
import { ProductsCreateRepository } from '../../src/products/repository/products-create.repository.js';
import { ProductsDeleteRepository } from '../../src/products/repository/products-delete.repository.js';
import { ProductsUpdateRepository } from '../../src/products/repository/products-update.repository.js';
import { ProductsService } from '../../src/products/products.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const BRAND_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const SUPPLIER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const CATEGORY_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';

// Full entity shape: decimals are strings (pg driver), relations populated
// the way ProductsFindRepository loads them.
const mockProduct = {
  id: PRODUCT_ID,
  sku: 'RHB-00001',
  brandCode: 'HS-130G / HS-130',
  name: 'LAMINADORA DE MESA PARA PIZZA',
  nameNormalized: undefined,
  description: 'Laminadora de mesa',
  capacityValue: '30.00',
  capacityUnitId: null,
  capacityUnit: { abbreviation: 'LBS', name: 'Libras' },
  brandId: BRAND_ID,
  brand: { id: BRAND_ID, name: 'COOKMATE' },
  supplierId: SUPPLIER_ID,
  supplier: { id: SUPPLIER_ID, name: 'TECNOPAN' },
  categoryId: CATEGORY_ID,
  category: { id: CATEGORY_ID, name: 'Hornos' },
  distributorPrice: '4810.00',
  salePrice: '5592.00',
  revenue: '782.00',
  marginPercent: '13.99',
  salesWeighting: SalesWeighting.HIGH,
  pricePending: false,
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  imageUrls: [],
  tags: ['clearance'],
  metaTitle: null,
  metaDescription: null,
  alternateCodes: [{ code: 'HS-130G' }, { code: 'HS-130' }],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  priceRules: [],
  promoCodes: [],
} as unknown as Product;

const makeCreateDto = (overrides = {}) => ({
  brandCode: 'HS-130G / HS-130',
  name: 'LAMINADORA DE MESA PARA PIZZA',
  brandId: BRAND_ID,
  supplierId: SUPPLIER_ID,
  categoryId: CATEGORY_ID,
  distributorPrice: 4810,
  salePrice: 5592,
  ...overrides,
});

const makeUpdateDto = (overrides = {}) => ({
  salePrice: 5800,
  ...overrides,
});

const makePaginatedResult = (
  products: Product[],
  page = 1,
  limit = 20,
): PaginatedResult<Product> => ({
  data: products,
  total: products.length,
  page,
  limit,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ProductsService', () => {
  let service: ProductsService;

  // Hoisted mock functions — plain variables, no unbound-method issue.
  let findAll: jest.Mock;
  let findById: jest.Mock;
  let findBySku: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let deactivate: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn();
    findById = jest.fn();
    findBySku = jest.fn();
    create = jest.fn();
    update = jest.fn();
    deactivate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsFindRepository,
          useValue: { findAll, findById, findBySku },
        },
        { provide: ProductsCreateRepository, useValue: { create } },
        { provide: ProductsUpdateRepository, useValue: { update } },
        { provide: ProductsDeleteRepository, useValue: { deactivate } },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll — maps entities to ProductResponseDto
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('returns the page mapped through ProductResponseDto', async () => {
      const query: GetProductDto = { page: 1, limit: 20 };
      findAll.mockResolvedValue(makePaginatedResult([mockProduct]));

      const response = await service.findAll(query);

      expect(findAll).toHaveBeenCalledWith(query);
      expect(response.total).toBe(1);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe(PRODUCT_ID);
      expect(response.data[0].sku).toBe('RHB-00001');
    });

    it('converts decimal strings to numbers in the response', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockProduct]));

      const response = await service.findAll({});
      const productResponse = response.data[0];

      expect(productResponse.distributorPrice).toBe(4810);
      expect(productResponse.salePrice).toBe(5592);
      expect(productResponse.revenue).toBe(782);
      expect(productResponse.marginPercent).toBe(13.99);
      expect(productResponse.capacityValue).toBe(30);
    });

    it('flattens brand, supplier, category, and capacity unit to names', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockProduct]));

      const response = await service.findAll({});
      const productResponse = response.data[0];

      expect(productResponse.brand).toBe('COOKMATE');
      expect(productResponse.supplier).toBe('TECNOPAN');
      expect(productResponse.category).toBe('Hornos');
      expect(productResponse.capacityUnit).toBe('LBS');
    });

    it('flattens alternate code entities to a string array', async () => {
      findAll.mockResolvedValue(makePaginatedResult([mockProduct]));

      const response = await service.findAll({});

      expect(response.data[0].alternateCodes).toEqual(['HS-130G', 'HS-130']);
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
    it('returns the mapped product when found', async () => {
      findById.mockResolvedValue(mockProduct);

      const result = await service.findOne(PRODUCT_ID);

      expect(findById).toHaveBeenCalledWith(PRODUCT_ID);
      expect(result.id).toBe(PRODUCT_ID);
      expect(result.salePrice).toBe(5592);
    });

    it('propagates NotFoundException from findRepo when id does not exist', async () => {
      findById.mockRejectedValue(
        new NotFoundException(`Product with id ${PRODUCT_ID} not found`),
      );

      await expect(service.findOne(PRODUCT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findBySku
  // -------------------------------------------------------------------------

  describe('findBySku', () => {
    it('returns the mapped product when the SKU exists', async () => {
      findBySku.mockResolvedValue(mockProduct);

      const result = await service.findBySku('RHB-00001');

      expect(findBySku).toHaveBeenCalledWith('RHB-00001');
      expect(result.sku).toBe('RHB-00001');
    });

    it('throws NotFoundException when the repo returns null', async () => {
      findBySku.mockResolvedValue(null);

      await expect(service.findBySku('RHB-99999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySku('RHB-99999')).rejects.toThrow(
        "Product with sku 'RHB-99999' not found",
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('returns the newly created product mapped to the response DTO', async () => {
      const dto = makeCreateDto();
      create.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(dto);
      expect(result.sku).toBe('RHB-00001');
      expect(result.salePrice).toBe(5592);
    });

    it('propagates BadRequestException when a foreign key is invalid', async () => {
      create.mockRejectedValue(
        new BadRequestException('brandId references a non-existent brand'),
      );

      await expect(service.create(makeCreateDto())).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(makeCreateDto())).rejects.toThrow(
        'brandId references a non-existent brand',
      );
    });

    it('does not call find, update, or deactivate during create', async () => {
      create.mockResolvedValue(mockProduct);

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
    it('returns the updated product mapped to the response DTO', async () => {
      const dto = makeUpdateDto();
      const updated = { ...mockProduct, salePrice: '5800.00' } as Product;
      update.mockResolvedValue(updated);

      const result = await service.update(PRODUCT_ID, dto);

      expect(update).toHaveBeenCalledWith(PRODUCT_ID, dto);
      expect(result.salePrice).toBe(5800);
      expect(result.name).toBe(mockProduct.name);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      update.mockRejectedValue(
        new NotFoundException(`Product with id ${PRODUCT_ID} not found`),
      );

      await expect(service.update(PRODUCT_ID, makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates ConflictException when alternate codes collide', async () => {
      update.mockRejectedValue(
        new ConflictException("Alternate code 'HS-130' already exists"),
      );

      await expect(service.update(PRODUCT_ID, makeUpdateDto())).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('returns the deactivation response on success', async () => {
      const deleteResponse: DeleteProductDto = {
        id: PRODUCT_ID,
        message: 'Product deactivated successfully',
        deactivatedAt: new Date('2026-06-11T12:00:00.000Z'),
      };
      deactivate.mockResolvedValue(deleteResponse);

      const result = await service.remove(PRODUCT_ID);

      expect(deactivate).toHaveBeenCalledTimes(1);
      expect(deactivate).toHaveBeenCalledWith(PRODUCT_ID);
      expect(result).toEqual(deleteResponse);
    });

    it('propagates NotFoundException when id does not exist', async () => {
      deactivate.mockRejectedValue(
        new NotFoundException(`Product with id ${PRODUCT_ID} not found`),
      );

      await expect(service.remove(PRODUCT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not call find, create, or update during remove', async () => {
      deactivate.mockResolvedValue({
        id: PRODUCT_ID,
        message: 'Product deactivated successfully',
        deactivatedAt: new Date(),
      });

      await service.remove(PRODUCT_ID);

      expect(findAll).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
