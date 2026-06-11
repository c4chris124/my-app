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
import { PriceRulesService } from './price-rules.service.js';
import { CreatePriceRuleDto } from './dtos/create-price-rule.dto.js';
import { UpdatePriceRuleDto } from './dtos/update-price-rule.dto.js';
import { GetPriceRuleDto } from './dtos/get-price-rule.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

// Rules are applied automatically server-side; every endpoint is admin/manager.
@Public()
@ApiTags('Price Rules')
@Controller('price-rules')
export class PriceRulesController {
  constructor(private readonly priceRulesService: PriceRulesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'List price rules with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of price rules' })
  findAll(@Query() query: GetPriceRuleDto) {
    return this.priceRulesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a single price rule by UUID' })
  @ApiOkResponse({ description: 'Price rule record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceRulesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create a new price rule (scope ids must match the scope)',
  })
  @ApiCreatedResponse({ description: 'Created price rule' })
  create(@Body() createPriceRuleDto: CreatePriceRuleDto) {
    return this.priceRulesService.create(createPriceRuleDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Partially update a price rule (cross-field rules re-checked on the merged state)',
  })
  @ApiOkResponse({ description: 'Updated price rule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePriceRuleDto: UpdatePriceRuleDto,
  ) {
    return this.priceRulesService.update(id, updatePriceRuleDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a price rule (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceRulesService.remove(id);
  }
}
