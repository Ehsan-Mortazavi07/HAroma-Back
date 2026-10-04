import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setSessionCookie(response: Response, result: Record<string, any>) {
    const { accessToken, ...safeResult } = result;
    if (accessToken) {
      const ttl = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');
      const amount = Number.parseInt(ttl, 10);
      const unit = ttl.at(-1);
      const multiplier = unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 1_000;
      response.cookie('hatefaroma_token', accessToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: amount * multiplier,
      });
    }
    return safeResult;
  }

  private getAuthHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (authorization) return authorization;
    const token = request.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('hatefaroma_token='))
      ?.slice('hatefaroma_token='.length);
    return token ? `Bearer ${token}` : undefined;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.setSessionCookie(response, await this.authService.login(dto));
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    return this.setSessionCookie(response, await this.authService.register(dto));
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    const authHeader = this.getAuthHeader(req);
    return this.authService.forgotPassword(dto.identifier, dto.channel, authHeader);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Req() req: Request, @Body() dto: ResetPasswordDto) {
    const authHeader = this.getAuthHeader(req);
    return this.authService.resetPassword(dto.identifier, dto.code, dto.newPassword, dto.confirmPassword, dto.channel, authHeader);
  }

  @Post('otp/send')
  @Throttle({ default: { limit: 3, ttl: 60_000, blockDuration: 120_000 } })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone, dto.purpose);
  }

  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setSessionCookie(response, await this.authService.verifyOtp(dto.phone, dto.code, dto.purpose));
  }

  @Post('logout')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('hatefaroma_token', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }

  @Post('otp/verify-phone')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyUserPhone(@CurrentUser() user: any, @Body() dto: VerifyOtpDto) {
    const userId = user._id ? user._id.toString() : user.id;
    return this.authService.verifyPhoneForUser(userId, dto.phone, dto.code);
  }
}
