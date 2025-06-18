import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogging');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, headers, ip } = request;

    const start = Date.now();
    const timestamp = new Date().toISOString();

    // Log de entrada de la request
    this.logger.log(`📥 INCOMING [${method}] ${url}`);
    this.logger.log(`🕒 Timestamp: ${timestamp}`);
    this.logger.log(`🌐 IP: ${ip}`);
    this.logger.log(`📱 User-Agent: ${headers['user-agent'] || 'Unknown'}`);

    // Verificar presencia del token
    const authHeader = headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        this.logger.log(`🔑 Token: PRESENT ✅`);
        const token = authHeader.replace('Bearer ', '');
        this.logger.log(`📏 Token length: ${token.length} chars`);
        this.logger.log(`👁️ Token preview: ${token.substring(0, 30)}...`);
      } else {
        this.logger.warn(
          `⚠️ Authorization header present but invalid format: ${authHeader}`,
        );
      }
    } else {
      this.logger.warn(`❌ NO TOKEN - Authorization header missing`);
    }

    // Log otros headers importantes
    const importantHeaders = {
      'content-type': headers['content-type'],
      accept: headers['accept'],
      origin: headers['origin'],
      referer: headers['referer'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-real-ip': headers['x-real-ip'],
    };

    this.logger.debug(`📋 Headers:`, importantHeaders);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `📤 RESPONSE [${method}] ${url} - ${response.statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
