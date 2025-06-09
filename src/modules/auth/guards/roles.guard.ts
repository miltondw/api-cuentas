import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('RolesGuard');

  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Checking roles for ${request.method} ${request.url}`);

    // If user has isPublic flag, it means we're in a public route
    if (user && user.isPublic === true) {
      return true;
    }

    if (!user || !user.role) {
      this.logger.error('Role check failed: user or user.role is undefined');
      return false;
    }
    this.logger.debug(`User role Required roles:`);

    // Make comparison more robust
    const userRole = user.role?.toString().toLowerCase();
    const hasRole = requiredRoles.some(role => userRole === role.toLowerCase());

    /* if (!hasRole) {
      this.logger.warn(`Access denied for user role: ${userRole}, Required one of: ${requiredRoles}`);
    } else {
      this.logger.debug(`Access granted for user role: ${userRole}`);
    } */

    return hasRole;
  }
}
