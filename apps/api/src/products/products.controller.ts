import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
// Preserves pre-auth behavior (public storefront catalog). Locking down
// mutations behind @Roles(ADMIN) is a follow-up product decision.
@Public()
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
}
