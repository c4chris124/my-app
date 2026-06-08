import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service.js';
import { ProductsService } from '../products/products.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}
}
