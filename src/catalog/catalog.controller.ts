import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { PageSectionsService } from '../page-sections/page-sections.service';
import { ProductQueryDto } from '../products/dtos';
import {
  mapProductDetail,
  mapProductSummary,
  mapCategory,
  mapVipPlan,
  mapPageSection,
} from './catalog.mapper';

@Controller({ version: '1', path: 'catalog' })
export class CatalogController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly vipPlansService: VipPlansService,
    private readonly pageSectionsService: PageSectionsService,
  ) {}

  @Get('products')
  async getProducts(@Query() query: ProductQueryDto) {
    const result = await this.productsService.findAll(query);
    return {
      items: result.items.map(mapProductSummary),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    return mapProductDetail(product);
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.categoriesService.findAll();
    return categories.map(mapCategory);
  }

  @Get('vip-plans')
  async getVipPlans() {
    const plans = await this.vipPlansService.findAll(true);
    return plans.map(mapVipPlan);
  }

  @Get('page-sections')
  async getPageSections() {
    const sections = await this.pageSectionsService.findAll();
    return sections.map(mapPageSection);
  }
}
