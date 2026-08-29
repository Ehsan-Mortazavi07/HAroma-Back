import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorMessages } from '../constants/error-messages';
import { hasPanelAccess } from '../../users/user-role.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException(ErrorMessages.UNAUTHORIZED);
    }
    return user;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.UNAUTHORIZED);
    }
    if (!hasPanelAccess(user.role)) {
      throw new ForbiddenException(ErrorMessages.FORBIDDEN);
    }
    return true;
  }
}

@Injectable()
export class SuperAdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.UNAUTHORIZED);
    }
    if (user.role !== 'admin') {
      throw new ForbiddenException('این بخش منحصراً برای مدیر کل (Admin) مجاز می‌باشد.');
    }
    return true;
  }
}
