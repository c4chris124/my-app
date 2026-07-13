import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CartsService } from './carts.service.js';
import { AddCartItemDto } from './dtos/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto.js';
import { CartResponseDto } from './dtos/cart-response.dto.js';
import { CustomerId } from '../common/decorators/actor-id.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

// TODO: drop @Public() and derive the customer from the JWT subject once
// session auth is wired into the storefront; x-customer-id is a stub.
@Public()
@ApiTags('Carts')
@ApiHeader({
  name: 'x-customer-id',
  description: 'Authenticated customer id (auth-context stub)',
  required: true,
})
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('active')
  @ApiOperation({
    summary:
      "Get (creating if needed) the caller's active cart with live-priced items",
  })
  @ApiOkResponse({ type: CartResponseDto })
  getActiveCart(@CustomerId() customerId: string) {
    return this.cartsService.getActiveCart(customerId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add a product to the cart (increments quantity if present)',
  })
  @ApiOkResponse({ type: CartResponseDto })
  addItem(
    @CustomerId() customerId: string,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartsService.addItem(customerId, addCartItemDto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: "Set a line's quantity (0 removes the line)" })
  @ApiOkResponse({ type: CartResponseDto })
  updateItemQty(
    @CustomerId() customerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItemQty(
      customerId,
      itemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove a line from the cart' })
  @ApiOkResponse({ type: CartResponseDto })
  removeItem(
    @CustomerId() customerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartsService.removeItem(customerId, itemId);
  }

  @Delete('active')
  @ApiOperation({ summary: 'Clear every line from the active cart' })
  @ApiOkResponse({ type: CartResponseDto })
  clear(@CustomerId() customerId: string) {
    return this.cartsService.clear(customerId);
  }
}
