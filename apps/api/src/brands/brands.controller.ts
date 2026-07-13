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
import { BrandsService } from './brands.service.js';
import { CreateBrandDto } from './dtos/create-brand.dto.js';
import { UpdateBrandDto } from './dtos/update-brand.dto.js';
import { GetBrandDto } from './dtos/get-brand.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({
    summary: 'List brands with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of brands' })
  findAll(@Query() query: GetBrandDto) {
    return this.brandsService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a single brand by its URL slug' })
  @ApiOkResponse({ description: 'Brand record' })
  findBySlug(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single brand by UUID' })
  @ApiOkResponse({ description: 'Brand record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new brand (slug is auto-generated)' })
  @ApiCreatedResponse({ description: 'Created brand' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Partially update a brand (slug regenerates if name changes)',
  })
  @ApiOkResponse({ description: 'Updated brand' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a brand (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.remove(id);
  }
}
