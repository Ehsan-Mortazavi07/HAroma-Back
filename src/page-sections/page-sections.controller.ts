import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PageSectionsService } from './page-sections.service';
import { UpdatePageSectionDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { SetVisibilityDto, SetVipOnlyDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class PageSectionsController {
  constructor(private readonly pageSectionsService: PageSectionsService) {}

  @Get('page-sections')
  async getPublicSections() {
    return this.pageSectionsService.findAll(false);
  }

  @Get('admin/page-sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListSections() {
    return this.pageSectionsService.adminFindAll();
  }

  @Patch('admin/page-sections/:sectionKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async updateSection(
    @Param('sectionKey') sectionKey: string,
    @Body() dto: UpdatePageSectionDto,
  ) {
    return this.pageSectionsService.updateByKey(sectionKey, dto);
  }

  @Patch('admin/page-sections/:sectionKey/toggle-vip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleVip(
    @Param('sectionKey') sectionKey: string,
    @Body() dto: SetVipOnlyDto,
  ) {
    return this.pageSectionsService.toggleVipOnly(sectionKey, dto.isVipOnly);
  }

  @Patch('admin/page-sections/:sectionKey/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async toggleVisibility(
    @Param('sectionKey') sectionKey: string,
    @Body() dto: SetVisibilityDto,
  ) {
    return this.pageSectionsService.toggleVisibility(sectionKey, dto.isVisible);
  }
}
