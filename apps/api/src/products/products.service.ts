import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginatedResult,
  ProductsFindRepository,
} from './repository/products-find.repository.js';
import { ProductsCreateRepository } from './repository/products-create.repository.js';
import { ProductsUpdateRepository } from './repository/products-update.repository.js';
import { ProductsDeleteRepository } from './repository/products-delete.repository.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { GetProductDto } from './dtos/get-product.dto.js';
import { DeleteProductDto } from './dtos/delete-product.dto.js';
import { ProductResponseDto } from './dtos/product-response.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsFindRepository: ProductsFindRepository,
    private readonly productsCreateRepository: ProductsCreateRepository,
    private readonly productsUpdateRepository: ProductsUpdateRepository,
    private readonly productsDeleteRepository: ProductsDeleteRepository,
  ) {}

  async findAll(
    query: GetProductDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const paginatedProducts = await this.productsFindRepository.findAll(query);
    return {
      ...paginatedProducts,
      data: paginatedProducts.data.map((product) =>
        ProductResponseDto.fromEntity(product),
      ),
    };
  }

  async findOne(productId: string): Promise<ProductResponseDto> {
    const product = await this.productsFindRepository.findById(productId);
    return ProductResponseDto.fromEntity(product);
  }

  async findBySku(productSku: string): Promise<ProductResponseDto> {
    const product = await this.productsFindRepository.findBySku(productSku);
    if (!product) {
      throw new NotFoundException(`Product with sku '${productSku}' not found`);
    }
    return ProductResponseDto.fromEntity(product);
  }

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const createdProduct =
      await this.productsCreateRepository.create(createProductDto);
    return ProductResponseDto.fromEntity(createdProduct);
  }

  async update(
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const updatedProduct = await this.productsUpdateRepository.update(
      productId,
      updateProductDto,
    );
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  remove(productId: string): Promise<DeleteProductDto> {
    return this.productsDeleteRepository.deactivate(productId);
  }
}
