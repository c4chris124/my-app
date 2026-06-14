import { Injectable } from '@nestjs/common';
import { CatalogsFindRepository } from './repository/catalogs-find.repository.js';
import type { CatalogListResponse } from '@myapp/shared';

@Injectable()
export class CatalogsService {
  constructor(private readonly findRepo: CatalogsFindRepository) {}

  findAll(): Promise<CatalogListResponse> {
    return this.findRepo.findAll();
  }
}
