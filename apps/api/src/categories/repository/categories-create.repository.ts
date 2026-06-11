import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { CreateCategoryDto } from '../dtos/create-category.dto.js';
import { CategoriesFindRepository } from './categories-find.repository.js';
import { toSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class CategoriesCreateRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoriesFindRepository: CategoriesFindRepository,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const generatedSlug = toSlug(createCategoryDto.name);

    const categoryWithSameName = await this.categoriesFindRepository.findByName(
      createCategoryDto.name,
    );
    if (categoryWithSameName) {
      throw new ConflictException(
        `Category with name '${createCategoryDto.name}' already exists`,
      );
    }

    const categoryWithSameSlug =
      await this.categoriesFindRepository.findBySlug(generatedSlug);
    if (categoryWithSameSlug) {
      throw new ConflictException(
        `Category with slug '${generatedSlug}' already exists`,
      );
    }

    if (createCategoryDto.parentId) {
      try {
        await this.categoriesFindRepository.findById(
          createCategoryDto.parentId,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException('Parent category not found');
        }
        throw error;
      }
    }

    const newCategory = this.categoryRepository.create({
      ...createCategoryDto,
      slug: generatedSlug,
    });
    return this.categoryRepository.save(newCategory);
  }
}
