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
import { PromoCodesService } from './promo-codes.service.js';
import { CreatePromoCodeDto } from './dtos/create-promo-code.dto.js';
import { UpdatePromoCodeDto } from './dtos/update-promo-code.dto.js';
import { GetPromoCodeDto } from './dtos/get-promo-code.dto.js';
import { ValidatePromoCodeDto } from './dtos/validate-promo-code.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@ApiTags('Promo Codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'List promo codes with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of promo codes' })
  findAll(@Query() query: GetPromoCodeDto) {
    return this.promoCodesService.findAll(query);
  }

  @Post('validate')
  @ApiOperation({
    summary:
      'Check whether a code is currently usable (read-only, no side effects)',
  })
  @ApiOkResponse({
    description: '{ valid: true, promoCode } or { valid: false, reason }',
  })
  validate(@Body() validatePromoCodeDto: ValidatePromoCodeDto) {
    return this.promoCodesService.validate(validatePromoCodeDto);
  }

  @Get('code/:code')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a promo code by code (case-insensitive)' })
  @ApiOkResponse({ description: 'Promo code record' })
  findByCode(@Param('code') code: string) {
    return this.promoCodesService.findByCode(code);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a single promo code by UUID' })
  @ApiOkResponse({ description: 'Promo code record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promoCodesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create a new promo code (code is stored uppercase)',
  })
  @ApiCreatedResponse({ description: 'Created promo code' })
  create(@Body() createPromoCodeDto: CreatePromoCodeDto) {
    return this.promoCodesService.create(createPromoCodeDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Partially update a promo code (cross-field rules re-checked on the merged state)',
  })
  @ApiOkResponse({ description: 'Updated promo code' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePromoCodeDto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(id, updatePromoCodeDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate a promo code (soft delete)' })
  @ApiOkResponse({ description: 'Deactivation confirmation with timestamp' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promoCodesService.remove(id);
  }
}
