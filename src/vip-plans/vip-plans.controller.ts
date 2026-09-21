import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VipPlansService } from './vip-plans.service';
import { CreateVipPlanDto, UpdateVipPlanDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class VipPlansController {
  constructor(private readonly vipPlansService: VipPlansService) {}

  // Public
  @Get('vip-plans')
  async getPublicVipPlans() {
    return this.vipPlansService.findAll(true);
  }

  // Admin
  @Get('admin/vip-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminListVipPlans() {
    return this.vipPlansService.findAll(false);
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/vip-plans/bulk/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('isActive') isActive: boolean,
  ) {
    return this.vipPlansService.bulkUpdateStatus(ids, isActive);
  }

  @Post('admin/vip-plans/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDelete(@Body('ids') ids: string[]) {
    return this.vipPlansService.bulkSoftDelete(ids);
  }

  @Get('admin/vip-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminGetVipPlan(@Param('id') id: string) {
    return this.vipPlansService.findById(id);
  }

  @Post('admin/vip-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminCreateVipPlan(@Body() dto: CreateVipPlanDto) {
    return this.vipPlansService.create(dto);
  }

  @Patch('admin/vip-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminUpdateVipPlan(
    @Param('id') id: string,
    @Body() dto: UpdateVipPlanDto,
  ) {
    return this.vipPlansService.update(id, dto);
  }

  @Delete('admin/vip-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminDeleteVipPlan(@Param('id') id: string) {
    return this.vipPlansService.softDelete(id);
  }
}
