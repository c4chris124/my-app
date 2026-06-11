import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { DeleteCategoryDto } from '../dtos/delete-category.dto.js';
import { CategoriesFindRepository } from './categories-find.repository.js';

@Injectable()
export class CategoriesDeleteRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoriesFindRepository: CategoriesFindRepository,
  ) {}

  async deactivate(categoryId: string): Promise<DeleteCategoryDto> {
    const categoryToDeactivate =
      await this.categoriesFindRepository.findById(categoryId);

    const activeChildrenCount = await this.categoryRepository.countBy({
      parentId: categoryId,
      isActive: true,
    });
    if (activeChildrenCount > 0) {
      throw new ConflictException(
        'Cannot deactivate a category that has active subcategories',
      );
    }

    categoryToDeactivate.isActive = false;
    await this.categoryRepository.save(categoryToDeactivate);

    return {
      id: categoryToDeactivate.id,
      message: 'Category deactivated successfully',
      deactivatedAt: new Date(),
    };
  }
}
