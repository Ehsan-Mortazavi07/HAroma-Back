import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, OrderStatus } from '../common/enums';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user._id || user.id, dto);
  }

  @Get('orders/my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findUserOrders(user._id || user.id);
  }

  @Get('orders/my/:id')
  @UseGuards(JwtAuthGuard)
  async getMyOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findUserOrderById(user._id || user.id, id);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('orders/track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  // Admin & Editor Endpoints
  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListOrders(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: OrderStatus,
    @Query('q') q?: string,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.findAll({ page, pageSize, status, q, userId });
  }

  @Get('admin/orders/dashboard-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/orders/bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminBulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.bulkUpdateStatus(ids, status);
  }

  @Post('admin/orders/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDeleteOrders(@Body('ids') ids: string[]) {
    return this.ordersService.bulkSoftDelete(ids);
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminGetOrder(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminUpdateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
