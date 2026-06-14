import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedemptionsService } from './redemptions.service.js';
import { GetRedemptionDto } from './dtos/get-redemption.dto.js';
import { RedemptionResponseDto } from './dtos/redemption-response.dto.js';
import { RolesGuard, Roles } from '../common/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';

// Reporting endpoints only — redemptions are written exclusively by the
// pricing engine inside checkout's transaction, never over HTTP.
@Public()
@ApiTags('Redemptions')
@Controller('redemptions')
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Paginated redemption history report' })
  @ApiOkResponse({ description: 'Paginated list of redemptions' })
  findAll(@Query() query: GetRedemptionDto) {
    return this.redemptionsService.findAll(query);
  }

  @Get('order/:orderId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Redemptions recorded for one order' })
  @ApiOkResponse({ type: [RedemptionResponseDto] })
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.redemptionsService.findByOrder(orderId);
  }
}
