import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('RolesGuard');

  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.log(`🛡️ [${method}] ${url} - Role validation`);

    if (isPublic) {
      this.logger.log('🔓 Route is PUBLIC, skipping role check');
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.log('✅ No specific roles required, allowing access');
      return true;
    }

    const { user } = request;

    this.logger.log(`🎯 Required roles: [${requiredRoles.join(', ')}]`);

    // If user has isPublic flag, it means we're in a public route
    if (user && user.isPublic === true) {
      this.logger.log('🔓 User has isPublic flag, allowing access');
      return true;
    }

    if (!user) {
      this.logger.error(
        '❌ No user found in request - JWT validation may have failed',
      );
      return false;
    }

    if (!user.role) {
      this.logger.error('❌ User object exists but has no role property');
      this.logger.debug(
        '👤 User object structure:',
        JSON.stringify(user, null, 2),
      );
      return false;
    }

    const userRole = user.role?.toString().toLowerCase();
    this.logger.log(
      `👤 User: ${user.email || user.userId || 'Unknown'} - Role: ${userRole}`,
    );

    // Make comparison more robust
    const hasRole = requiredRoles.some(role => userRole === role.toLowerCase());

    if (!hasRole) {
      this.logger.error(
        `🚫 ACCESS DENIED - User role '${userRole}' not in required roles: [${requiredRoles.join(', ')}]`,
      );
    } else {
      this.logger.log(
        `✅ ACCESS GRANTED - User role '${userRole}' is authorized`,
      );
    }

    return hasRole;
  }
}
