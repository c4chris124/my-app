import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceRuleDto } from './create-price-rule.dto.js';

export class UpdatePriceRuleDto extends PartialType(CreatePriceRuleDto) {}
