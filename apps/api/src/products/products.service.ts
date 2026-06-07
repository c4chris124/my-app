import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { ProductAlternateCode } from './entities/product-alternate-code.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import {
  PaginatedProductResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductAlternateCode)
    private readonly altCodeRepo: Repository<ProductAlternateCode>,
  ) {}

  async findAll(query: ProductQueryDto): Promise<PaginatedProductResponseDto> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      brandId,
      supplierId,
      minPrice,
      maxPrice,
      search,
      tag,
      isFeatured,
      isActive = true,
    } = query;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.capacityUnit', 'unit')
      .leftJoinAndSelect('p.alternateCodes', 'ac')
      .where('p.isActive = :isActive', { isActive });

    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (brandId) qb.andWhere('p.brandId = :brandId', { brandId });
    if (supplierId) qb.andWhere('p.supplierId = :supplierId', { supplierId });
    if (minPrice !== undefined)
      qb.andWhere('p.salePrice >= :minPrice', { minPrice });
    if (maxPrice !== undefined)
      qb.andWhere('p.salePrice <= :maxPrice', { maxPrice });
    if (search) {
      qb.andWhere('p.name ILIKE :search', { search: `%${search}%` });
    }
    if (tag) qb.andWhere(':tag = ANY(p.tags)', { tag });
    if (isFeatured !== undefined)
      qb.andWhere('p.isFeatured = :isFeatured', { isFeatured });

    const total = await qb.getCount();
    const products = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('p.sortOrder', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .getMany();

    return {
      data: products.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: {
        brand: true,
        supplier: true,
        category: true,
        capacityUnit: true,
        alternateCodes: true,
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.toResponseDto(product);
  }

  async findBySku(sku: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { sku },
      relations: {
        brand: true,
        supplier: true,
        category: true,
        capacityUnit: true,
        alternateCodes: true,
      },
    });
    if (!product)
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    return this.toResponseDto(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const { alternateCodes, ...rest } = dto;
    const product = this.productRepo.create(rest);
    if (rest.salePrice && rest.distributorPrice) {
      product.revenue = Number(rest.salePrice) - Number(rest.distributorPrice);
    }
    const saved = await this.productRepo.save(product);

    if (alternateCodes?.length) {
      const codes = alternateCodes.map((code) =>
        this.altCodeRepo.create({ productId: saved.id, code }),
      );
      await this.altCodeRepo.save(codes);
    }

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productRepo.findOneOrFail({ where: { id } });
    const { alternateCodes, ...rest } = dto as CreateProductDto & Partial<{ alternateCodes: string[] }>;

    if (rest.salePrice !== undefined && rest.distributorPrice !== undefined) {
      (rest as any).revenue =
        Number(rest.salePrice) - Number(rest.distributorPrice);
    } else if (rest.salePrice !== undefined && existing.distributorPrice) {
      (rest as any).revenue =
        Number(rest.salePrice) - Number(existing.distributorPrice);
    } else if (rest.distributorPrice !== undefined && existing.salePrice) {
      (rest as any).revenue =
        Number(existing.salePrice) - Number(rest.distributorPrice);
    }

    await this.productRepo.update(id, rest);

    if (alternateCodes !== undefined) {
      await this.altCodeRepo.delete({ productId: id });
      if (alternateCodes.length) {
        const codes = alternateCodes.map((code) =>
          this.altCodeRepo.create({ productId: id, code }),
        );
        await this.altCodeRepo.save(codes);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productRepo.findOneOrFail({ where: { id } });
    await this.productRepo.update(id, { isActive: false });
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      brandCode: product.brandCode,
      name: product.name,
      description: product.description,
      capacityValue: product.capacityValue
        ? Number(product.capacityValue)
        : null,
      capacityUnit: product.capacityUnit?.abbreviation ?? null,
      brand: product.brand?.name ?? '',
      supplier: product.supplier?.name ?? '',
      category: product.category?.name ?? '',
      distributorPrice: product.distributorPrice
        ? Number(product.distributorPrice)
        : null,
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      revenue: product.revenue ? Number(product.revenue) : null,
      marginPercent: product.marginPercent
        ? Number(product.marginPercent)
        : null,
      salesWeighting: product.salesWeighting,
      pricePending: product.pricePending,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      imageUrls: product.imageUrls ?? [],
      tags: product.tags ?? [],
      alternateCodes: product.alternateCodes?.map((c) => c.code) ?? [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
