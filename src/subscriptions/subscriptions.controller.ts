import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscriptions/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @CurrentUser() user: any,
    @Body('planId') planId: string,
  ) {
    return this.subscriptionsService.subscribe(user._id || user.id, planId);
  }

  @Get('subscriptions/my')
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserSubscriptions(user._id || user.id);
  }

  @Get('subscriptions/active')
  @UseGuards(JwtAuthGuard)
  async getMyActiveSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getUserActiveSubscription(user._id || user.id);
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminListSubscriptions(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.subscriptionsService.adminListSubscriptions({ page, pageSize });
  }
}
