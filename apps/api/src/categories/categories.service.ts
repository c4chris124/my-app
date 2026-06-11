import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './entities/category.entity.js';
import {
  CategoriesFindRepository,
  CategoryTreeNode,
  PaginatedResult,
} from './repository/categories-find.repository.js';
import { CategoriesCreateRepository } from './repository/categories-create.repository.js';
import { CategoriesUpdateRepository } from './repository/categories-update.repository.js';
import { CategoriesDeleteRepository } from './repository/categories-delete.repository.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';
import { GetCategoryDto } from './dtos/get-category.dto.js';
import { DeleteCategoryDto } from './dtos/delete-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesFindRepository: CategoriesFindRepository,
    private readonly categoriesCreateRepository: CategoriesCreateRepository,
    private readonly categoriesUpdateRepository: CategoriesUpdateRepository,
    private readonly categoriesDeleteRepository: CategoriesDeleteRepository,
  ) {}

  findAll(
    query: GetCategoryDto,
  ): Promise<CategoryTreeNode[] | PaginatedResult<Category>> {
    if (query.tree !== false) {
      return this.categoriesFindRepository.findTree();
    }
    return this.categoriesFindRepository.findAllFlat(query);
  }

  findOne(categoryId: string): Promise<Category> {
    return this.categoriesFindRepository.findById(categoryId);
  }

  async findBySlug(categorySlug: string): Promise<Category> {
    const category =
      await this.categoriesFindRepository.findBySlug(categorySlug);
    if (!category) {
      throw new NotFoundException(
        `Category with slug '${categorySlug}' not found`,
      );
    }
    return category;
  }

  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesCreateRepository.create(createCategoryDto);
  }

  update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesUpdateRepository.update(
      categoryId,
      updateCategoryDto,
    );
  }

  remove(categoryId: string): Promise<DeleteCategoryDto> {
    return this.categoriesDeleteRepository.deactivate(categoryId);
  }
}
