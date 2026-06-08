import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service.js';
import { CalculatePriceDto } from './dto/calculate-price.dto.js';
import { ValidatePromoDto } from './dto/validate-promo.dto.js';
import {
  PriceBreakdownDto,
  ValidatePromoResponseDto,
} from './dto/price-breakdown.dto.js';
import {
  CreatePriceRuleDto,
  UpdatePriceRuleDto,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from './dto/manage-rule.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity.js';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate final price(s) for cart items' })
  @ApiResponse({ status: 200, type: [PriceBreakdownDto] })
  async calculate(
    @Body() dto: CalculatePriceDto,
  ): Promise<PriceBreakdownDto[]> {
    const results: PriceBreakdownDto[] = [];
    for (const item of dto.items) {
      const product = await this.productRepo.findOneOrFail({
        where: { id: item.productId },
      });
      const breakdown = await this.pricingService.calculateProductPrice(
        product,
        item.quantity,
        dto.customerId ? 'registered' : 'guest',
        dto.promoCode,
      );
      results.push(breakdown);
    }
    return results;
  }

  @Post('validate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a promo code against cart context' })
  @ApiResponse({ status: 200, type: ValidatePromoResponseDto })
  async validateCode(
    @Body() dto: ValidatePromoDto,
  ): Promise<ValidatePromoResponseDto> {
    try {
      await this.pricingService.validatePromoCode(dto.code, dto.cartContext);
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  @Get('rules')
  @ApiOperation({ summary: 'List all price rules' })
  async getRules() {
    return this.pricingService.findAllRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a price rule' })
  async createRule(@Body() dto: CreatePriceRuleDto) {
    return this.pricingService.createRule(dto as any);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update a price rule' })
  async updateRule(@Param('id') id: string, @Body() dto: UpdatePriceRuleDto) {
    return this.pricingService.updateRule(id, dto as any);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a price rule' })
  async deactivateRule(@Param('id') id: string) {
    await this.pricingService.deactivateRule(id);
  }

  @Get('promo-codes')
  @ApiOperation({ summary: 'List all promo codes' })
  async getPromoCodes() {
    return this.pricingService.findAllPromoCodes();
  }

  @Post('promo-codes')
  @ApiOperation({ summary: 'Create a promo code' })
  async createPromoCode(@Body() dto: CreatePromoCodeDto) {
    return this.pricingService.createPromoCode(dto as any);
  }

  @Patch('promo-codes/:id')
  @ApiOperation({ summary: 'Update a promo code' })
  async updatePromoCode(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.pricingService.updatePromoCode(id, dto as any);
  }

  @Delete('promo-codes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a promo code' })
  async deactivatePromoCode(@Param('id') id: string) {
    await this.pricingService.deactivatePromoCode(id);
  }
}
