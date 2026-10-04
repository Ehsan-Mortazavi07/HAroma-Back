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
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BulkIdsDto, BulkSetActiveDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // Public Endpoints
  @Get('brands')
  async getAllBrands(
    @Query('q') q?: string,
    @Query('featuredOnly') featuredOnly?: string,
  ) {
    return this.brandsService.findAll({
      q,
      featuredOnly: featuredOnly === 'true',
    });
  }

  @Get('brands/:slug')
  async getBrandBySlug(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  // Admin & Editor Endpoints
  @Get('admin/brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListBrands(@Query('q') q?: string) {
    return this.brandsService.findAll({ q, includeInactive: true });
  }

  @Post('admin/brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminCreateBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/brands/bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminBulkUpdateStatus(@Body() dto: BulkSetActiveDto) {
    return this.brandsService.bulkUpdateStatus(dto.ids, dto.isActive);
  }

  @Post('admin/brands/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDelete(@Body() dto: BulkIdsDto) {
    return this.brandsService.bulkSoftDelete(dto.ids);
  }

  @Get('admin/brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminGetBrand(@Param('id') id: string) {
    return this.brandsService.findById(id);
  }

  @Patch('admin/brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminUpdateBrand(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, dto);
  }

  @Delete('admin/brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminDeleteBrand(@Param('id') id: string) {
    return this.brandsService.softDelete(id);
  }
}
