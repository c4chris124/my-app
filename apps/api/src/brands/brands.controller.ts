import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service.js';
import { ProductsService } from '../products/products.service.js';
import { ProductQueryDto } from '../products/dto/product-query.dto.js';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active brands' })
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Products by brand slug' })
  async findProductsByBrand(
    @Param('slug') slug: string,
    @Query() query: ProductQueryDto,
  ) {
    const brand = await this.brandsService.findAll();
    const found = brand.find((b) => b.slug === slug);
    if (!found) return { data: [], total: 0, page: 1, limit: query.limit ?? 20, totalPages: 0 };
    return this.productsService.findAll({ ...query, brandId: found.id });
  }
}
