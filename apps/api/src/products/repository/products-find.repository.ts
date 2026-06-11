import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import {
  GetProductDto,
  ProductSortColumn,
} from '../dtos/get-product.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const SORTABLE_COLUMN_MAP: Record<ProductSortColumn, string> = {
  name: 'product.name',
  salePrice: 'product.salePrice',
  sortOrder: 'product.sortOrder',
  createdAt: 'product.createdAt',
};

@Injectable()
export class ProductsFindRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findById(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        brand: true,
        supplier: true,
        category: true,
        capacityUnit: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }
    return product;
  }

  async findBySku(productSku: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { sku: productSku },
      relations: {
        brand: true,
        supplier: true,
        category: true,
        capacityUnit: true,
      },
    });
  }

  async findAll(query: GetProductDto): Promise<PaginatedResult<Product>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const productsQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.capacityUnit', 'capacityUnit')
      .leftJoinAndSelect('product.alternateCodes', 'alternateCode');

    if (query.search) {
      productsQuery.andWhere(
        "to_tsvector('spanish', product.name) @@ plainto_tsquery('spanish', :search)",
        { search: query.search },
      );
    }

    if (query.categoryId) {
      productsQuery.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.brandId) {
      productsQuery.andWhere('product.brandId = :brandId', {
        brandId: query.brandId,
      });
    }

    if (query.supplierId) {
      productsQuery.andWhere('product.supplierId = :supplierId', {
        supplierId: query.supplierId,
      });
    }

    if (query.minPrice !== undefined) {
      productsQuery.andWhere('product.salePrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      productsQuery.andWhere('product.salePrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.salesWeighting) {
      productsQuery.andWhere('product.salesWeighting = :salesWeighting', {
        salesWeighting: query.salesWeighting,
      });
    }

    if (query.pricePending !== undefined) {
      productsQuery.andWhere('product.pricePending = :pricePending', {
        pricePending: query.pricePending,
      });
    }

    if (query.isFeatured !== undefined) {
      productsQuery.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    if (query.isActive !== undefined) {
      productsQuery.andWhere('product.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.tag) {
      productsQuery.andWhere(':tag = ANY(product.tags)', { tag: query.tag });
    }

    const sortColumn = SORTABLE_COLUMN_MAP[query.sortBy ?? 'sortOrder'];
    const sortDirection = query.sortDir === 'DESC' ? 'DESC' : 'ASC';

    const [products, totalProducts] = await productsQuery
      .orderBy(sortColumn, sortDirection)
      .addOrderBy('product.id', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: products,
      total: totalProducts,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  async findMaxSkuCounter(): Promise<number> {
    const maxCounterRow = await this.productRepository
      .createQueryBuilder('product')
      .select(
        "COALESCE(MAX(CAST(SUBSTRING(product.sku FROM 'RHB-([0-9]+)') AS INTEGER)), 0)",
        'maxCounter',
      )
      .where("product.sku ~ '^RHB-[0-9]+$'")
      .getRawOne<{ maxCounter: string | number | null }>();

    return Number(maxCounterRow?.maxCounter ?? 0);
  }
}
