import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceRule } from '../entities/price-rule.entity.js';
import {
  GetPriceRuleDto,
  PriceRuleSortColumn,
} from '../dtos/get-price-rule.dto.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicableRulesParams {
  productId: string;
  categoryId: string;
  brandId: string;
  quantity: number;
  orderTotal?: number;
}

const SORTABLE_COLUMN_MAP: Record<PriceRuleSortColumn, string> = {
  priority: 'rule.priority',
  name: 'rule.name',
  discountValue: 'rule.discountValue',
  createdAt: 'rule.createdAt',
};

@Injectable()
export class PriceRulesFindRepository {
  constructor(
    @InjectRepository(PriceRule)
    private readonly priceRuleRepository: Repository<PriceRule>,
  ) {}

  async findById(priceRuleId: string): Promise<PriceRule> {
    const priceRule = await this.priceRuleRepository.findOne({
      where: { id: priceRuleId },
      relations: { scopeCategory: true, scopeBrand: true, scopeProduct: true },
    });
    if (!priceRule) {
      throw new NotFoundException(
        `Price rule with id ${priceRuleId} not found`,
      );
    }
    return priceRule;
  }

  async findAll(query: GetPriceRuleDto): Promise<PaginatedResult<PriceRule>> {
    const currentPage = query.page ?? 1;
    const itemsPerPage = query.limit ?? 20;

    const priceRulesQuery = this.priceRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.scopeCategory', 'scopeCategory')
      .leftJoinAndSelect('rule.scopeBrand', 'scopeBrand')
      .leftJoinAndSelect('rule.scopeProduct', 'scopeProduct');

    if (query.search) {
      priceRulesQuery.andWhere('rule.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.ruleType) {
      priceRulesQuery.andWhere('rule.ruleType = :ruleType', {
        ruleType: query.ruleType,
      });
    }

    if (query.scope) {
      priceRulesQuery.andWhere('rule.scope = :scope', { scope: query.scope });
    }

    if (query.scopeCategoryId) {
      priceRulesQuery.andWhere('rule.scopeCategoryId = :scopeCategoryId', {
        scopeCategoryId: query.scopeCategoryId,
      });
    }

    if (query.scopeBrandId) {
      priceRulesQuery.andWhere('rule.scopeBrandId = :scopeBrandId', {
        scopeBrandId: query.scopeBrandId,
      });
    }

    if (query.scopeProductId) {
      priceRulesQuery.andWhere('rule.scopeProductId = :scopeProductId', {
        scopeProductId: query.scopeProductId,
      });
    }

    if (query.isActive !== undefined) {
      priceRulesQuery.andWhere('rule.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.activeNow) {
      priceRulesQuery
        .andWhere('rule.isActive = true')
        .andWhere('(rule.validFrom IS NULL OR rule.validFrom <= :now)', {
          now: new Date(),
        })
        .andWhere('(rule.validUntil IS NULL OR rule.validUntil >= :now)');
    }

    if (query.isStackable !== undefined) {
      priceRulesQuery.andWhere('rule.isStackable = :isStackable', {
        isStackable: query.isStackable,
      });
    }

    const sortColumn = SORTABLE_COLUMN_MAP[query.sortBy ?? 'priority'];
    const sortDirection = query.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const [priceRules, totalPriceRules] = await priceRulesQuery
      .orderBy(sortColumn, sortDirection)
      .addOrderBy('rule.createdAt', 'DESC')
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getManyAndCount();

    return {
      data: priceRules,
      total: totalPriceRules,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  // Read-only candidate query for the pricing engine. The engine owns
  // stacking/selection logic and the CLEARANCE-tag filter.
  async findApplicableRules(
    params: ApplicableRulesParams,
  ): Promise<PriceRule[]> {
    const applicableRulesQuery = this.priceRuleRepository
      .createQueryBuilder('rule')
      .where('rule.isActive = true')
      .andWhere('(rule.validFrom IS NULL OR rule.validFrom <= :now)', {
        now: new Date(),
      })
      .andWhere('(rule.validUntil IS NULL OR rule.validUntil >= :now)')
      .andWhere('rule.minQuantity <= :quantity', { quantity: params.quantity })
      .andWhere(
        "(rule.scope = 'ALL_PRODUCTS'" +
          " OR (rule.scope = 'CATEGORY' AND rule.scopeCategoryId = :categoryId)" +
          " OR (rule.scope = 'BRAND' AND rule.scopeBrandId = :brandId)" +
          " OR (rule.scope = 'PRODUCT' AND rule.scopeProductId = :productId))",
        {
          categoryId: params.categoryId,
          brandId: params.brandId,
          productId: params.productId,
        },
      );

    if (params.orderTotal !== undefined) {
      applicableRulesQuery.andWhere(
        '(rule.minOrderValue IS NULL OR rule.minOrderValue <= :orderTotal)',
        { orderTotal: params.orderTotal },
      );
    }

    return applicableRulesQuery.orderBy('rule.priority', 'DESC').getMany();
  }
}
