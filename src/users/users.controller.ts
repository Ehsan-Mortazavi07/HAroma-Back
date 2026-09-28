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
import { UsersService } from './users.service';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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

  // ==========================================
  // User Address Management Endpoints
  // ==========================================
  @Get('users/addresses')
  @UseGuards(JwtAuthGuard)
  async getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user._id || user.id);
  }

  @Post('users/addresses')
  @UseGuards(JwtAuthGuard)
  async addAddress(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(user._id || user.id, dto);
  }

  @Patch('users/addresses/:id')
  @UseGuards(JwtAuthGuard)
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user._id || user.id, addressId, dto);
  }

  @Delete('users/addresses/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(user._id || user.id, addressId);
  }

  @Patch('users/addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  async setDefaultAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(user._id || user.id, addressId);
  }

}
