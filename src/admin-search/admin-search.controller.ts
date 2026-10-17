import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminSearchService } from './admin-search.service';

class AdminSearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

@Controller('admin/search')
@UseGuards(ThrottlerGuard, JwtAuthGuard, AdminGuard)
export class AdminSearchController {
  constructor(private readonly searchService: AdminSearchService) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  search(@Query() query: AdminSearchQueryDto, @CurrentUser() user: any) {
    return this.searchService.search(query.q || '', user?.role);
  }
}
