import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service.js';
import { ProductsService } from '../products/products.service.js';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}
}
