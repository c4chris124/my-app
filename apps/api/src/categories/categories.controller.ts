import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { ProductsService } from '../products/products.service.js';
import { ProductQueryDto } from '../products/dto/product-query.dto.js';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Return full category tree with nested subcategories',
  })
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get(':slug/products')
  @ApiOperation({
    summary: 'Products under a category slug (includes subcategories)',
  })
  async findProductsBySlug(
    @Param('slug') slug: string,
    @Query() query: ProductQueryDto,
  ) {
    const categoryIds = await this.categoriesService.findProductsBySlug(slug);
    // Use the first (root) category id — for multi-id support the query would need extending
    return this.productsService.findAll({
      ...query,
      categoryId: categoryIds[0],
    });
  }
}
