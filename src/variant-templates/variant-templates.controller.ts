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
import { VariantTemplatesService } from './variant-templates.service';
import { CreateVariantTemplateDto, UpdateVariantTemplateDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { BulkIdsDto } from '../common/dtos/admin-operation.dto';

@Controller()
export class VariantTemplatesController {
  constructor(private readonly variantTemplatesService: VariantTemplatesService) {}

  @Get('variant-templates')
  async getPublicTemplates() {
    return this.variantTemplatesService.findAll();
  }

  @Get('admin/variant-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminListTemplates() {
    return this.variantTemplatesService.findAll();
  }

  @Get('admin/variant-templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async adminGetTemplate(@Param('id') id: string) {
    return this.variantTemplatesService.findOne(id);
  }

  @Post('admin/variant-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async createTemplate(@Body() dto: CreateVariantTemplateDto) {
    return this.variantTemplatesService.create(dto);
  }

  @Patch('admin/variant-templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateVariantTemplateDto,
  ) {
    return this.variantTemplatesService.update(id, dto);
  }

  @Delete('admin/variant-templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async deleteTemplate(@Param('id') id: string) {
    return this.variantTemplatesService.remove(id);
  }

  @Post('admin/variant-templates/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkDeleteTemplates(@Body() dto: BulkIdsDto) {
    return this.variantTemplatesService.bulkSoftDelete(dto.ids);
  }
}
