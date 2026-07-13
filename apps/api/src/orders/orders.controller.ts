import {
  Body,
  Controller,
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
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CheckoutDto } from './dtos/checkout.dto.js';
import {
  ChangeFulfillmentStatusDto,
  ChangePaymentStatusDto,
} from './dtos/change-status.dto.js';
import { GetOrderDto } from './dtos/get-order.dto.js';
import { CancelOrderDto, DeleteOrderDto } from './dtos/delete-order.dto.js';
import { OrderResponseDto } from './dtos/order-response.dto.js';
import { OrderStatusHistoryItemDto } from './dtos/order-status-history-item.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import {
  ActorId,
  CustomerId,
} from '../common/decorators/actor-id.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

// TODO: drop @Public() and derive customerId/changedById from the JWT subject
// once session auth is wired in; the x-customer-id/x-user-id headers are stubs.
@Public()
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Literal sub-path declared before the /:id routes.
  @Post('checkout')
  @ApiOperation({
    summary:
      "Create an immutable order from the caller's active cart (prices snapshot at this moment)",
  })
  @ApiHeader({
    name: 'x-customer-id',
    description: 'Authenticated customer id (auth-context stub)',
    required: true,
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  checkout(@CustomerId() customerId: string, @Body() checkoutDto: CheckoutDto) {
    return this.ordersService.checkout(customerId, checkoutDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'List orders for the CRM table (filters, search, date range)',
  })
  @ApiOkResponse({ description: 'Paginated list of order rows' })
  findAll(@Query() query: GetOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get full order detail with snapshotted items' })
  @ApiOkResponse({ type: OrderResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/history')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Chronological status-change timeline' })
  @ApiOkResponse({ type: [OrderStatusHistoryItemDto] })
  findStatusHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findStatusHistory(id);
  }

  @Patch(':id/fulfillment-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Move the fulfillment status (forward or one-step rollback per the transition map)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Acting staff user id (auth-context stub)',
    required: false,
  })
  @ApiOkResponse({ type: OrderResponseDto })
  changeFulfillmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeFulfillmentStatusDto,
    @ActorId() changedById?: string,
  ) {
    return this.ordersService.changeFulfillmentStatus(
      id,
      changeStatusDto,
      changedById,
    );
  }

  @Patch(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Move the payment status (independent of fulfillment)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Acting staff user id (auth-context stub)',
    required: false,
  })
  @ApiOkResponse({ type: OrderResponseDto })
  changePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangePaymentStatusDto,
    @ActorId() changedById?: string,
  ) {
    return this.ordersService.changePaymentStatus(
      id,
      changeStatusDto,
      changedById,
    );
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({
    summary:
      'Cancel an order (status transition to CANCELLED; rejected once DELIVERED)',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Acting staff user id (auth-context stub)',
    required: false,
  })
  @ApiOkResponse({ type: DeleteOrderDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @ActorId() changedById?: string,
  ) {
    return this.ordersService.cancel(id, cancelOrderDto, changedById);
  }
}
