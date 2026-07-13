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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';
import { GetCategoryDto } from './dtos/get-category.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List categories as a nested tree (default) or a flat paginated list with ?tree=false',
  })
  @ApiOkResponse({
    description:
      'Nested tree with productCount per node, or paginated flat list',
  })
  findAll(@Query() query: GetCategoryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a single category by its URL slug' })
  @ApiOkResponse({ description: 'Category record' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by UUID' })
  @ApiOkResponse({ description: 'Category record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new category (slug is auto-generated)' })
  @ApiCreatedResponse({ description: 'Created category' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Partially update a category (slug regenerates if name changes; parentId null detaches to top-level)',
  })
  @ApiOkResponse({ description: 'Updated category' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a category (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
