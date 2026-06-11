import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity.js';
import { DeleteProductDto } from '../dtos/delete-product.dto.js';
import { ProductsFindRepository } from './products-find.repository.js';

@Injectable()
export class ProductsDeleteRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productsFindRepository: ProductsFindRepository,
  ) {}

  async deactivate(productId: string): Promise<DeleteProductDto> {
    const productToDeactivate =
      await this.productsFindRepository.findById(productId);

    productToDeactivate.isActive = false;
    await this.productRepository.save(productToDeactivate);

    return {
      id: productToDeactivate.id,
      message: 'Product deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
