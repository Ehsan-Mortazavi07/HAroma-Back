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
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BulkIdsDto, BulkSetActiveDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Public/User endpoint to validate promo code at checkout
  @Post('coupons/validate')
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }

  // Admin endpoints
  @Get('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminListCoupons(@Query('q') q?: string) {
    return this.couponsService.findAll({ q });
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/coupons/bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkUpdateStatus(@Body() dto: BulkSetActiveDto) {
    return this.couponsService.bulkUpdateStatus(dto.ids, dto.isActive);
  }

  @Post('admin/coupons/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDelete(@Body() dto: BulkIdsDto) {
    return this.couponsService.bulkSoftDelete(dto.ids);
  }

  @Get('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminGetCoupon(@Param('id') id: string) {
    return this.couponsService.findById(id);
  }

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminCreateCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminUpdateCoupon(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, dto);
  }

  @Delete('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminDeleteCoupon(@Param('id') id: string) {
    return this.couponsService.softDelete(id);
  }
}
