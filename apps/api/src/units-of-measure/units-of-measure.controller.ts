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
import { UnitsOfMeasureService } from './units-of-measure.service.js';
import { CreateUnitOfMeasureDto } from './dtos/create-unit-of-measure.dto.js';
import { UpdateUnitOfMeasureDto } from './dtos/update-unit-of-measure.dto.js';
import { GetUnitOfMeasureDto } from './dtos/get-unit-of-measure.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';

@ApiTags('Units of Measure')
@Controller('units-of-measure')
export class UnitsOfMeasureController {
  constructor(private readonly service: UnitsOfMeasureService) {}

  @Get()
  @ApiOperation({
    summary:
      'List all active units of measure with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of units of measure' })
  findAll(@Query() query: GetUnitOfMeasureDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single unit of measure by UUID' })
  @ApiOkResponse({ description: 'Unit of measure record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new unit of measure' })
  @ApiCreatedResponse({ description: 'Created unit of measure' })
  create(@Body() dto: CreateUnitOfMeasureDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Partially update a unit of measure' })
  @ApiOkResponse({ description: 'Updated unit of measure' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitOfMeasureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a unit of measure (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
