import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { GetCategoryDto } from '../dtos/get-category.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesFindRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findById(categoryId: string): Promise<Category> {
    try {
      return await this.categoryRepository.findOneByOrFail({ id: categoryId });
    } catch {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }
  }

  async findByName(categoryName: string): Promise<Category | null> {
    return this.categoryRepository
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name: categoryName })
      .getOne();
  }

  async findBySlug(categorySlug: string): Promise<Category | null> {
    return this.categoryRepository.findOneBy({ slug: categorySlug });
  }

  async findAllFlat(query: GetCategoryDto): Promise<PaginatedResult<Category>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const categoriesQuery =
      this.categoryRepository.createQueryBuilder('category');

    if (query.search) {
      categoriesQuery.andWhere('category.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.parentId) {
      categoriesQuery.andWhere('category.parentId = :parentId', {
        parentId: query.parentId,
      });
    }

    if (query.isActive !== undefined) {
      categoriesQuery.andWhere('category.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const [categories, totalCategories] = await categoriesQuery
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: categories,
      total: totalCategories,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    const allActiveCategories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const productCountsByCategoryId = await this.getProductCounts();

    const childrenByParentId = new Map<string | null, Category[]>();
    for (const category of allActiveCategories) {
      const siblings = childrenByParentId.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParentId.set(category.parentId, siblings);
    }

    const toTreeNode = (category: Category): CategoryTreeNode => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      productCount: productCountsByCategoryId.get(category.id) ?? 0,
      children: (childrenByParentId.get(category.id) ?? []).map(toTreeNode),
    });

    return (childrenByParentId.get(null) ?? []).map(toTreeNode);
  }

  async findDescendantIds(categoryId: string): Promise<string[]> {
    const allCategories = await this.categoryRepository.find({
      select: { id: true, parentId: true },
    });

    const childIdsByParentId = new Map<string, string[]>();
    for (const category of allCategories) {
      if (!category.parentId) continue;
      const childIds = childIdsByParentId.get(category.parentId) ?? [];
      childIds.push(category.id);
      childIdsByParentId.set(category.parentId, childIds);
    }

    const descendantIds: string[] = [];
    const idsToVisit = [...(childIdsByParentId.get(categoryId) ?? [])];
    while (idsToVisit.length > 0) {
      const currentId = idsToVisit.shift() as string;
      descendantIds.push(currentId);
      idsToVisit.push(...(childIdsByParentId.get(currentId) ?? []));
    }

    return descendantIds;
  }

  async getProductCounts(): Promise<Map<string, number>> {
    const productCountsByCategoryId = new Map<string, number>();

    try {
      const countRows: { categoryId: string; productCount: string }[] =
        await this.categoryRepository.manager
          .createQueryBuilder()
          .select('p.category_id', 'categoryId')
          .addSelect('COUNT(*)', 'productCount')
          .from('products', 'p')
          .where('p.is_active = true')
          .groupBy('p.category_id')
          .getRawMany();

      for (const countRow of countRows) {
        productCountsByCategoryId.set(
          countRow.categoryId,
          parseInt(countRow.productCount, 10),
        );
      }
    } catch {
      // products table not migrated yet — tree still builds with counts of 0
    }

    return productCountsByCategoryId;
  }
}
