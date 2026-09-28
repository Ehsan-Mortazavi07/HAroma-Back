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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, AdminGuard, SuperAdminOnlyGuard } from '../common/guards/auth.guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { AttributesService } from '../attributes/attributes.service';
import { OrdersService } from '../orders/orders.service';
import { CouponsService } from '../coupons/coupons.service';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { PageSectionsService } from '../page-sections/page-sections.service';
import { UploadsService } from '../uploads/uploads.service';

import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  BulkUpdateProductStatusDto,
  BulkDeleteProductsDto,
} from '../products/dtos';
import { CreateCategoryDto, UpdateCategoryDto } from '../categories/dtos';
import { CreateAttributeDto, UpdateAttributeDto, QuickCreateAttributeDto } from '../attributes/dtos';
import { CreateCouponDto } from '../coupons/dtos';
import { CreateVipPlanDto, UpdateVipPlanDto } from '../vip-plans/dtos';
import { UpdatePageSectionDto } from '../page-sections/dtos';
import {
  CreateUserDto,
  UpdateAddressDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserVipDto,
} from '../users/dtos';
import { UserRole, OrderStatus } from '../common/enums';

@Controller({ version: '1', path: 'admin' })
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly attributesService: AttributesService,
    private readonly ordersService: OrdersService,
    private readonly couponsService: CouponsService,
    private readonly vipPlansService: VipPlansService,
    private readonly pageSectionsService: PageSectionsService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ----------------------------------------------------
  // Dashboard Analytics
  // ----------------------------------------------------
  @Get('dashboard')
  @Get('orders/dashboard-stats')
  async getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  // ----------------------------------------------------
  // Products Management
  // ----------------------------------------------------
  @Get('products')
  async getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // Bulk operations MUST come before :id routes to avoid NestJS matching 'bulk' as an :id param
  @Patch('products/bulk/status')
  async bulkUpdateProductStatus(@Body() dto: BulkUpdateProductStatusDto) {
    return this.productsService.bulkUpdateStatus(dto.ids, dto.isPublished);
  }

  @Post('products/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteProducts(@Body() dto: BulkDeleteProductsDto) {
    return this.productsService.bulkSoftDelete(dto.ids);
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete('products/:id')
  @UseGuards(SuperAdminOnlyGuard)
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  // ----------------------------------------------------
  // Categories Management
  // ----------------------------------------------------
  @Get('categories')
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // Bulk operations MUST come before :id routes
  @Patch('categories/bulk/status')
  async bulkUpdateCategoriesStatus(@Body('ids') ids: string[], @Body('isActive') isActive: boolean) {
    return this.categoriesService.bulkUpdateStatus(ids, isActive);
  }

  @Post('categories/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteCategories(@Body('ids') ids: string[]) {
    return this.categoriesService.bulkSoftDelete(ids);
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.softDelete(id);
  }

  // ----------------------------------------------------
  // Attributes & Quick Create
  // ----------------------------------------------------
  @Get('attributes')
  async getAttributes() {
    return this.attributesService.findAll();
  }

  @Post('attributes')
  async createAttribute(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  // Static/Bulk operations MUST come before :id routes
  @Post('attributes/quick-create')
  async quickCreateAttribute(@Body() dto: QuickCreateAttributeDto) {
    return this.attributesService.quickCreate(dto);
  }

  @Post('attributes/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteAttributes(@Body('ids') ids: string[]) {
    return this.attributesService.bulkSoftDelete(ids);
  }

  @Get('attributes/:id')
  async getAttribute(@Param('id') id: string) {
    return this.attributesService.findById(id);
  }

  @Patch('attributes/:id')
  async updateAttribute(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Delete('attributes/:id')
  async deleteAttribute(@Param('id') id: string) {
    return this.attributesService.softDelete(id);
  }

  // ----------------------------------------------------
  // Orders Management
  // ----------------------------------------------------
  @Get('orders')
  async getOrders(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: OrderStatus,
    @Query('q') q?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status,
      q,
    });
  }

  // Bulk operations MUST come before :id routes to prevent matching 'bulk' as :id
  @Patch('orders/bulk/status')
  async bulkUpdateOrdersStatus(
    @Body('ids') ids: string[],
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.bulkUpdateStatus(ids, status);
  }

  @Post('orders/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteOrders(@Body('ids') ids: string[]) {
    return this.ordersService.bulkSoftDelete(ids);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('trackingCode') trackingCode?: string,
  ) {
    return this.ordersService.updateStatus(id, { status, trackingCode });
  }

  @Delete('orders/:id')
  @UseGuards(SuperAdminOnlyGuard)
  async deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOne(id);
  }

  // ----------------------------------------------------
  // Coupons Management
  // ----------------------------------------------------
  @Get('coupons')
  async getCoupons() {
    return this.couponsService.findAll();
  }

  @Post('coupons')
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  // Bulk operations MUST come before :id routes
  @Patch('coupons/bulk/status')
  async bulkUpdateCouponsStatus(
    @Body('ids') ids: string[],
    @Body('isActive') isActive: boolean,
  ) {
    return this.couponsService.bulkUpdateStatus(ids, isActive);
  }

  @Post('coupons/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteCoupons(@Body('ids') ids: string[]) {
    return this.couponsService.bulkSoftDelete(ids);
  }

  @Patch('coupons/:id')
  async updateCoupon(@Param('id') id: string, @Body() dto: Partial<CreateCouponDto>) {
    return this.couponsService.update(id, dto);
  }

  @Delete('coupons/:id')
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.softDelete(id);
  }

  // ----------------------------------------------------
  // VIP Plans Management
  // ----------------------------------------------------
  @Get('vip-plans')
  async getVipPlans() {
    return this.vipPlansService.findAll();
  }

  @Post('vip-plans')
  async createVipPlan(@Body() dto: CreateVipPlanDto) {
    return this.vipPlansService.create(dto);
  }

  // Bulk operations MUST come before :id routes
  @Patch('vip-plans/bulk/status')
  async bulkUpdateVipPlansStatus(
    @Body('ids') ids: string[],
    @Body('isActive') isActive: boolean,
  ) {
    return this.vipPlansService.bulkUpdateStatus(ids, isActive);
  }

  @Post('vip-plans/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteVipPlans(@Body('ids') ids: string[]) {
    return this.vipPlansService.bulkSoftDelete(ids);
  }

  @Patch('vip-plans/:id')
  async updateVipPlan(@Param('id') id: string, @Body() dto: UpdateVipPlanDto) {
    return this.vipPlansService.update(id, dto);
  }

  @Delete('vip-plans/:id')
  async deleteVipPlan(@Param('id') id: string) {
    return this.vipPlansService.softDelete(id);
  }

  // ----------------------------------------------------
  // Users Management (View: Admin & Editor, Delete/Role: Admin only)
  // ----------------------------------------------------
  @Get('users')
  async getUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('q') q?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      q,
      role,
    });
  }

  @Post('users')
  @UseGuards(SuperAdminOnlyGuard)
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // Bulk operations MUST come before :id routes to avoid matching 'bulk' as an :id param
  @Patch('users/bulk/vip')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkUpdateUsersVip(
    @Body('ids') ids: string[],
    @Body('isVip') isVip: boolean,
    @Body('durationDays') durationDays?: number,
  ) {
    return this.usersService.bulkUpdateVip(ids, isVip, durationDays);
  }

  @Post('users/bulk/delete')
  @UseGuards(SuperAdminOnlyGuard)
  async bulkDeleteUsers(@Body('ids') ids: string[], @CurrentUser() currentUser: any) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.bulkSoftDelete(ids, currentUserId);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('users/:id/addresses')
  async getUserAddresses(@Param('id') id: string) {
    return this.usersService.getAddresses(id);
  }

  @Patch('users/:id/addresses/:addressId')
  @UseGuards(SuperAdminOnlyGuard)
  async updateUserAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(id, addressId, dto);
  }

  @Delete('users/:id/addresses/:addressId')
  @UseGuards(SuperAdminOnlyGuard)
  async deleteUserAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(id, addressId);
  }

  @Patch('users/:id')
  @UseGuards(SuperAdminOnlyGuard)
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto, true);
  }

  @Patch('users/:id/role')
  @UseGuards(SuperAdminOnlyGuard)
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.setRole(id, dto.role as UserRole, currentUserId);
  }

  @Patch('users/:id/vip')
  @UseGuards(SuperAdminOnlyGuard)
  async updateUserVip(@Param('id') id: string, @Body() dto: UpdateUserVipDto) {
    return this.usersService.toggleVip(id, dto.isVip, dto.durationDays);
  }

  @Delete('users/:id')
  @UseGuards(SuperAdminOnlyGuard)
  async deleteUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.softDelete(id, currentUserId);
  }

  // ----------------------------------------------------
  // Page Sections & VIP Customizer
  // ----------------------------------------------------
  @Get('page-sections')
  async getPageSections() {
    return this.pageSectionsService.adminFindAll();
  }

  @Patch('page-sections/:key')
  async updatePageSection(@Param('key') key: string, @Body() dto: UpdatePageSectionDto) {
    return this.pageSectionsService.updateByKey(key, dto);
  }

  @Patch('page-sections/:key/toggle-vip')
  async toggleSectionVip(@Param('key') key: string, @Body('isVipOnly') isVipOnly: boolean) {
    return this.pageSectionsService.toggleVipOnly(key, isVipOnly);
  }

  @Patch('page-sections/:key/toggle-visibility')
  async toggleSectionVisibility(
    @Param('key') key: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.pageSectionsService.toggleVisibility(key, isVisible);
  }

  // ----------------------------------------------------
  // Image Upload (Sharp WebP)
  // ----------------------------------------------------
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('فایل تصویری ارسال نشده است.');
    }
    return this.uploadsService.processAndSaveImage(file);
  }
}
