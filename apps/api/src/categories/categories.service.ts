import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CategoryTreeDto } from '@myapp/shared';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findTree(): Promise<CategoryTreeDto[]> {
    const all = await this.categoryRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const countMap = await this.categoryRepo
      .createQueryBuilder('c')
      .select('p.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .from('products', 'p')
      .where('p.isActive = true')
      .groupBy('p.categoryId')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of countMap) {
      counts[row.categoryId] = parseInt(row.count, 10);
    }

    const toDto = (cat: Category): CategoryTreeDto => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      productCount: counts[cat.id] ?? 0,
      children: all.filter((c) => c.parentId === cat.id).map(toDto),
    });

    return all.filter((c) => c.parentId === null).map(toDto);
  }

  async findProductsBySlug(slug: string) {
    const category = await this.categoryRepo.findOne({ where: { slug } });
    if (!category) throw new NotFoundException(`Category '${slug}' not found`);

    // Collect this category + all descendant IDs
    const all = await this.categoryRepo.find();
    const ids = this.collectDescendants(all, category.id);

    return ids;
  }

  private collectDescendants(all: Category[], rootId: string): string[] {
    const ids: string[] = [rootId];
    const children = all.filter((c) => c.parentId === rootId);
    for (const child of children) {
      ids.push(...this.collectDescendants(all, child.id));
    }
    return ids;
  }
}
