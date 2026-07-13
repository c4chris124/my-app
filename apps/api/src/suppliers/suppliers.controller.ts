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
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dtos/create-supplier.dto.js';
import { UpdateSupplierDto } from './dtos/update-supplier.dto.js';
import { GetSupplierDto } from './dtos/get-supplier.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({
    summary: 'List suppliers with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of suppliers' })
  findAll(@Query() query: GetSupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a single supplier by its URL slug' })
  @ApiOkResponse({ description: 'Supplier record' })
  findBySlug(@Param('slug') slug: string) {
    return this.suppliersService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single supplier by UUID' })
  @ApiOkResponse({ description: 'Supplier record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new supplier (slug is auto-generated)' })
  @ApiCreatedResponse({ description: 'Created supplier' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Partially update a supplier (slug regenerates if name changes)',
  })
  @ApiOkResponse({ description: 'Updated supplier' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a supplier (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }
}
