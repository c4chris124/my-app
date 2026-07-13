import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { GetProductDto } from './dtos/get-product.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List products with full-text search, filters, sorting, and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of products' })
  findAll(@Query() query: GetProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get a single product by its REHOBOT SKU' })
  @ApiOkResponse({ description: 'Product record' })
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by UUID' })
  @ApiOkResponse({ description: 'Product record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Create a new product (SKU is auto-generated; alternate codes derive from brandCode)',
  })
  @ApiCreatedResponse({ description: 'Created product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Partially update a product (SKU is immutable; alternateCodes replaces the set)',
  })
  @ApiOkResponse({ description: 'Updated product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a product (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
