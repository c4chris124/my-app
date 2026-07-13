import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service.js';

@ApiTags('Catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List top-level product categories with item counts',
  })
  @ApiOkResponse({ description: 'Catalog list' })
  findAll() {
    return this.service.findAll();
  }
}
