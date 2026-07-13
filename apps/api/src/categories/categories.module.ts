import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity.js';
import { CategoriesFindRepository } from './repository/categories-find.repository.js';
import { CategoriesCreateRepository } from './repository/categories-create.repository.js';
import { CategoriesUpdateRepository } from './repository/categories-update.repository.js';
import { CategoriesDeleteRepository } from './repository/categories-delete.repository.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    CategoriesFindRepository,
    CategoriesCreateRepository,
    CategoriesUpdateRepository,
    CategoriesDeleteRepository,
    CategoriesService,
  ],
  exports: [CategoriesService, CategoriesFindRepository],
})
export class CategoriesModule {}
