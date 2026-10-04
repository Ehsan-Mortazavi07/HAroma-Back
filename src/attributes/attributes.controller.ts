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
import { AttributesService } from './attributes.service';
import {
  CreateAttributeDto,
  QuickCreateAttributeDto,
  UpdateAttributeDto,
} from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BulkIdsDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  // Public Endpoints
  @Get('attributes')
  async getAllAttributes(@Query('q') q?: string) {
    return this.attributesService.findAll({ q });
  }

  @Get('attributes/:id')
  async getAttributeById(@Param('id') id: string) {
    return this.attributesService.findById(id);
  }

  // Admin & Editor Endpoints
  @Get('admin/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListAttributes(@Query('q') q?: string) {
    return this.attributesService.findAll({ q });
  }

  @Post('admin/attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminCreateAttribute(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Post('admin/attributes/quick-create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminQuickCreateAttribute(@Body() dto: QuickCreateAttributeDto) {
    return this.attributesService.quickCreate(dto);
  }

  // Bulk operations MUST come before :id routes
  @Post('admin/attributes/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBulkDeleteAttributes(@Body() dto: BulkIdsDto) {
    return this.attributesService.bulkSoftDelete(dto.ids);
  }

  @Patch('admin/attributes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminUpdateAttribute(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.attributesService.update(id, dto);
  }

  @Delete('admin/attributes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminDeleteAttribute(@Param('id') id: string) {
    return this.attributesService.softDelete(id);
  }
}
