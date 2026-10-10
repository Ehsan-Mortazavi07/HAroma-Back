import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ThrottlerModule.forRoot([{ name: 'default', limit: 300, ttl: 60_000, blockDuration: 60_000 }]),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.getOrThrow<string>('JWT_EXPIRES_IN') || '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ThrottlerGuard, OptionalJwtAuthGuard],
  exports: [AuthService, OptionalJwtAuthGuard, JwtModule],
})
export class AuthModule {}
