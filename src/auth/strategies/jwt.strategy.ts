import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { headers?: { cookie?: string } }) => {
          const cookie = request.headers?.cookie
            ?.split(';')
            .map((item) => item.trim())
            .find((item) => item.startsWith('hatefaroma_token='));
          return cookie ? cookie.slice('hatefaroma_token='.length) : null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deleted) {
      throw new UnauthorizedException('توکن نامعتبر است یا کاربر وجود ندارد.');
    }
    if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('نشست شما منقضی شده است؛ دوباره وارد شوید.');
    }
    return user;
  }
}
