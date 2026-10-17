import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(ThrottlerGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Beacon endpoint. Accepts `text/plain` JSON so `navigator.sendBeacon` can
   * post cross-origin without a CORS preflight.
   */
  @Post('collect')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async collect(@Body() body: string, @Req() request: Request, @CurrentUser() user?: any) {
    await this.analyticsService.collect(body, {
      userAgent: String(request.headers['user-agent'] || ''),
      user,
    });
  }
}
