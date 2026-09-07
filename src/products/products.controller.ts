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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public Endpoints
  @Get('products')
  async getAllProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('products/featured')
  async getFeaturedProducts(@Query('limit') limit?: number) {
    return this.productsService.getFeaturedProducts(limit ? Number(limit) : 8);
  }

  @Get('products/best-sellers')
  async getBestSellers(@Query('limit') limit?: number) {
    return this.productsService.getBestSellers(limit ? Number(limit) : 8);
  }

  @Get('products/vip-exclusive')
  async getVipExclusiveProducts(@Query('limit') limit?: number) {
    return this.productsService.getVipExclusiveProducts(limit ? Number(limit) : 8);
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('products/:id/related')
  async getRelatedProducts(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getRelatedProducts(id, limit ? Number(limit) : 4);
  }

  // Admin & Editor Endpoints
  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll({ ...query, includeUnpublished: 'true' });
  }

  @Get('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminGetProduct(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminCreateProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminUpdateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminDeleteProduct(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
