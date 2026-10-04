import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BulkIdsDto, BulkSetActiveDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Public Endpoints
  @Get('categories')
  async getAllCategories(
    @Query('q') q?: string,
    @Query('featuredOnly') featuredOnly?: string,
  ) {
    return this.categoriesService.findAll({
      q,
      featuredOnly: featuredOnly === 'true',
    });
  }

  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // Admin & Editor Endpoints
  @Get('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListCategories(@Query('q') q?: string) {
    return this.categoriesService.findAll({ q, includeInactive: true });
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/categories/bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminBulkUpdateStatus(@Body() dto: BulkSetActiveDto) {
    return this.categoriesService.bulkUpdateStatus(dto.ids, dto.isActive);
  }

  @Post('admin/categories/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDelete(@Body() dto: BulkIdsDto) {
    return this.categoriesService.bulkSoftDelete(dto.ids);
  }

  @Get('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminGetCategory(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminCreateCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminUpdateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminDeleteCategory(@Param('id') id: string) {
    return this.categoriesService.softDelete(id);
  }
}
