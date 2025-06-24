import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blockedUntil?: number;
  };
}

@Injectable()
export class AdvancedRateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor(private reflector: Reflector) {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Get rate limit metadata from decorator
    const limits =
      this.reflector.get<{
        windowMs: number;
        max: number;
        blockDurationMs?: number;
      }>('rateLimit', context.getHandler()) || this.getDefaultLimits(request);

    // Generate key based on IP and user (if authenticated)
    const key = this.generateKey(request);

    // Check rate limit
    return this.checkRateLimit(key, limits);
  }

  private generateKey(request: Request): string {
    const ip = this.getClientIP(request);
    const userId = (request as any).user?.id || 'anonymous';
    const path = request.route?.path || request.path;

    return `${ip}:${userId}:${path}`;
  }

  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }

  private getDefaultLimits(request: Request) {
    const path = request.path;

    // Different limits for different endpoints
    if (path.includes('/auth/login')) {
      return {
        windowMs: 15 * 60 * 1000,
        max: 5,
        blockDurationMs: 30 * 60 * 1000,
      }; // 5 attempts per 15 min, block 30 min
    }

    if (path.includes('/auth/')) {
      return {
        windowMs: 15 * 60 * 1000,
        max: 10,
        blockDurationMs: 15 * 60 * 1000,
      }; // 10 attempts per 15 min
    }

    if (path.includes('/api/')) {
      return { windowMs: 60 * 1000, max: 100 }; // 100 requests per minute for API
    }

    return { windowMs: 60 * 1000, max: 60 }; // Default: 60 requests per minute
  }

  private checkRateLimit(
    key: string,
    limits: { windowMs: number; max: number; blockDurationMs?: number },
  ): boolean {
    const now = Date.now();
    const entry = this.store[key];

    // Check if currently blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      throw new HttpException(
        {
          message: 'Too many requests, you are temporarily blocked',
          blockedUntil: new Date(entry.blockedUntil).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + limits.windowMs,
      };
      return true;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > limits.max) {
      // Apply block if specified
      if (limits.blockDurationMs) {
        entry.blockedUntil = now + limits.blockDurationMs;
      }

      throw new HttpException(
        {
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          limit: limits.max,
          windowMs: limits.windowMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key];
      if (
        now > entry.resetTime &&
        (!entry.blockedUntil || now > entry.blockedUntil)
      ) {
        delete this.store[key];
      }
    });
  }
}

// Decorator for setting custom rate limits
export const RateLimit = (options: {
  windowMs: number;
  max: number;
  blockDurationMs?: number;
}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', options, descriptor.value);
  };
};
