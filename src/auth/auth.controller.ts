import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dtos';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Req() req: any, @Body() dto: ForgotPasswordDto) {
    const authHeader = req?.headers?.authorization;
    return this.authService.forgotPassword(dto.identifier, dto.channel, authHeader);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Req() req: any, @Body() dto: ResetPasswordDto) {
    const authHeader = req?.headers?.authorization;
    return this.authService.resetPassword(dto.identifier, dto.code, dto.newPassword, dto.confirmPassword, dto.channel, authHeader);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone, dto.purpose);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.purpose);
  }

  @Post('otp/verify-phone')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyUserPhone(@CurrentUser() user: any, @Body() dto: VerifyOtpDto) {
    const userId = user._id ? user._id.toString() : user.id;
    return this.authService.verifyPhoneForUser(userId, dto.phone, dto.code);
  }
}

