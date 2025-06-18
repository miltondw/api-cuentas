import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger('JwtAuthGuard');

  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const { url, method, ip, headers } = request;
    const authHeader = request.headers.authorization;
    const userAgent = headers['user-agent'] || 'Unknown';

    // Log básico de la request
    this.logger.log(`🔐 [${method}] ${url} - IP: ${ip}`);
    this.logger.log(`📱 User-Agent: ${userAgent}`);
    this.logger.log(`🔓 isPublic: ${isPublic}`);

    // Log detallado del header de autorización
    if (authHeader) {
      this.logger.log(`✅ Authorization header: PRESENT`);
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const tokenPreview = token.substring(0, 20) + '...';
        this.logger.log(`🎫 Token format: VALID (${tokenPreview})`);
        this.logger.log(`📏 Token length: ${token.length} characters`);
      } else {
        this.logger.error(
          `❌ Invalid Authorization header format: ${authHeader}`,
        );
      }
    } else {
      this.logger.error(`❌ Authorization header: MISSING`);
    }

    // Log de todos los headers relevantes para debugging
    this.logger.debug(`📋 Relevant headers:`, {
      authorization: authHeader ? '***PRESENT***' : 'MISSING',
      'content-type': headers['content-type'],
      accept: headers.accept,
      origin: headers.origin,
      referer: headers.referer,
    });

    if (isPublic) {
      this.logger.log(`🔓 PUBLIC endpoint - allowing access without token`);
      // For public routes, set a dummy user to avoid further auth checks
      request.user = { isPublic: true };
      return true;
    }

    // Para endpoints protegidos, verificar que el token esté presente
    if (!authHeader) {
      this.logger.error(`🚫 PROTECTED endpoint requires Authorization header`);
      throw new UnauthorizedException('Authorization header is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.error(
        `🚫 Invalid Authorization header format. Expected 'Bearer <token>'`,
      );
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    this.logger.log(`🔒 PROTECTED endpoint - validating token...`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { url, method } = request;

    if (err) {
      this.logger.error(
        `❌ Authentication error for ${method} ${url}:`,
        err.message,
      );
      throw err;
    }

    if (!user) {
      this.logger.error(
        `❌ No user found for ${method} ${url}. Info:`,
        info?.message || 'No additional info',
      );
      throw new UnauthorizedException('Token validation failed');
    }

    this.logger.log(
      `✅ Authentication successful for ${method} ${url} - User: ${user.email} (Role: ${user.role})`,
    );
    return user;
  }
}
