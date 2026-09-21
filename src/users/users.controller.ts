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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user._id || user.id);
  }

  @Patch('users/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    const { role, isVip, vipExpiresAt, ...safeDto } = dto;
    return this.usersService.update(user._id || user.id, safeDto, false);
  }

  // Admin & Editor endpoints
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async listUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('q') q?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({ page, pageSize, q, role });
  }

  // Bulk operations MUST come before :id routes
  @Patch('admin/users/bulk/vip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkUpdateUsersVip(
    @Body('ids') ids: string[],
    @Body('isVip') isVip: boolean,
    @Body('durationDays') durationDays?: number,
  ) {
    return this.usersService.bulkUpdateVip(ids, isVip, durationDays);
  }

  @Post('admin/users/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkDeleteUsers(
    @Body('ids') ids: string[],
    @CurrentUser() currentUser: any,
  ) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.bulkSoftDelete(ids, currentUserId);
  }

  @Get('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto, true);
  }

  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser() currentUser: any,
  ) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.setRole(id, role, currentUserId);
  }

  @Patch('admin/users/:id/vip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleVip(
    @Param('id') id: string,
    @Body('isVip') isVip: boolean,
    @Body('durationDays') durationDays?: number,
  ) {
    return this.usersService.toggleVip(id, isVip, durationDays);
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const currentUserId = currentUser?._id?.toString() || currentUser?.sub?.toString();
    return this.usersService.softDelete(id, currentUserId);
  }
}
