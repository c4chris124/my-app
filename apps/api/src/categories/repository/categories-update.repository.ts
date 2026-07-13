import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { UpdateCategoryDto } from '../dtos/update-category.dto.js';
import { CategoriesFindRepository } from './categories-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class CategoriesUpdateRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoriesFindRepository: CategoriesFindRepository,
  ) {}

  async update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.categoriesFindRepository.findById(categoryId);

    const newName = updateCategoryDto.name;
    const regeneratedSlug = newName ? toSlug(newName) : undefined;

    if (newName && regeneratedSlug) {
      const otherCategoryWithSameName =
        await this.categoriesFindRepository.findByName(newName);
      if (
        otherCategoryWithSameName &&
        otherCategoryWithSameName.id !== categoryId
      ) {
        throw new ConflictException(
          `Category with name '${newName}' already exists`,
        );
      }

      const otherCategoryWithSameSlug =
        await this.categoriesFindRepository.findBySlug(regeneratedSlug);
      if (
        otherCategoryWithSameSlug &&
        otherCategoryWithSameSlug.id !== categoryId
      ) {
        throw new ConflictException(
          `Category with slug '${regeneratedSlug}' already exists`,
        );
      }
    }

    const proposedParentId = updateCategoryDto.parentId;
    if (proposedParentId !== undefined && proposedParentId !== null) {
      if (proposedParentId === categoryId) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      try {
        await this.categoriesFindRepository.findById(proposedParentId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException('Parent category not found');
        }
        throw error;
      }

      const descendantIds =
        await this.categoriesFindRepository.findDescendantIds(categoryId);
      if (descendantIds.includes(proposedParentId)) {
        throw new BadRequestException(
          'Cannot move a category under its own descendant',
        );
      }
    }

    const updatePayload = regeneratedSlug
      ? { id: categoryId, ...updateCategoryDto, slug: regeneratedSlug }
      : { id: categoryId, ...updateCategoryDto };

    const categoryToUpdate = await this.categoryRepository.preload(
      updatePayload as Partial<Category> & { id: string },
    );
    if (!categoryToUpdate) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    return this.categoryRepository.save(categoryToUpdate);
  }
}
