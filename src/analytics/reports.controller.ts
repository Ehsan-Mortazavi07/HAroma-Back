import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AdminGuard, SuperAdminOnlyGuard } from '../common/guards/auth.guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { ReportsService } from './reports.service';
import { ProductReportQueryDto, ReportRangeQueryDto, VisitorReportQueryDto } from './dtos';

/**
 * Admin analytics. Editors can see traffic and behaviour; monetary figures are
 * reserved for the admin role.
 */
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private canSeeFinance(user: any): boolean {
    return user?.role === UserRole.ADMIN;
  }

  @Get('overview')
  overview(@Query() query: ReportRangeQueryDto, @CurrentUser() user: any) {
    return this.reportsService.overview(query, this.canSeeFinance(user));
  }

  @Get('finance')
  @UseGuards(SuperAdminOnlyGuard)
  finance(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.finance(query);
  }

  @Get('traffic')
  traffic(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.traffic(query);
  }

  @Get('products')
  products(@Query() query: ProductReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.products(query, this.canSeeFinance(user));
  }

  @Get('products/:id')
  productDetail(@Param('id') id: string, @Query() query: ReportRangeQueryDto, @CurrentUser() user: any) {
    return this.reportsService.productDetail(id, query, this.canSeeFinance(user));
  }

  @Get('visitors')
  visitors(@Query() query: VisitorReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.visitors(query, this.canSeeFinance(user));
  }

  @Get('visitors/:key')
  visitorDetail(@Param('key') key: string, @Query() query: ReportRangeQueryDto, @CurrentUser() user: any) {
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) {
      throw new NotFoundException('بازدیدکننده یافت نشد.');
    }
    return this.reportsService.visitorDetail(key, query, this.canSeeFinance(user));
  }
}
