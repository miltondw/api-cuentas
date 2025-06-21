import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Centralized function to determine if rate limiting should be skipped
 */
function shouldSkipRateLimit(req: Request): boolean {
  // 1. Always skip in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Rate limiting skipped: Development environment');
    return true;
  }

  // 2. Get client IP address from various sources
  const clientIP =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    'unknown';
  // 3. Get whitelist from environment
  const envWhitelist =
    process.env.DEV_IP_WHITELIST?.split(',')
      .map(ip => ip.trim())
      .filter(Boolean) || [];

  // 4. Skip for development and local IPs
  const developmentIPs = [
    '127.0.0.1',
    '::1',
    'localhost',
    '::ffff:127.0.0.1',
    '192.168.1.1',
    ...envWhitelist, // Agregar IPs de la variable de entorno
  ];

  const isLocalIP = developmentIPs.some(ip => {
    if (typeof clientIP === 'string') {
      // Comparación exacta o si contiene la IP (para casos como ::ffff:192.168.1.14)
      return clientIP === ip || clientIP.includes(ip);
    }
    return false;
  });

  if (isLocalIP) {
    console.log(
      `🏠 Rate limiting skipped: Whitelisted IP detected (${clientIP})`,
    );
    return true;
  }

  // 4. Skip for health check and public endpoints
  const publicPaths = ['/health', '/', '/api/health', '/info', '/api/info'];
  if (publicPaths.includes(req.path)) {
    console.log(
      `🏥 Rate limiting skipped: Health check endpoint (${req.path})`,
    );
    return true;
  }

  // 5. Skip for Render health checks and monitoring services
  const userAgent = req.get('User-Agent') || '';
  const renderUserAgents = [
    'render-health-check',
    'healthcheck',
    'health-check',
    'render',
    'pingdom',
    'uptimerobot',
    'monitor',
  ];

  const isMonitoringService = renderUserAgents.some(agent =>
    userAgent.toLowerCase().includes(agent.toLowerCase()),
  );

  if (isMonitoringService) {
    console.log(
      `🤖 Rate limiting skipped: Monitoring service detected (${userAgent})`,
    );
    return true;
  }

  // 6. Log when rate limiting is applied
  console.log(
    `⚡ Rate limiting applied for IP: ${clientIP}, Path: ${req.path}, User-Agent: ${userAgent}`,
  );
  return false;
}

// Rate limiting configurations for different endpoints
const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
  }),

  // Moderate rate limiting for password reset
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
      error: 'Too many password reset attempts, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
  }),
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Determine which rate limiter to use based on the path
    let limiter = rateLimiters.general;

    if (
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/register')
    ) {
      limiter = rateLimiters.auth;
    } else if (
      req.path.includes('/auth/forgot-password') ||
      req.path.includes('/auth/reset-password')
    ) {
      limiter = rateLimiters.passwordReset;
    }

    // Apply the rate limiter
    limiter(req, res, next);
  }
}

// Factory function to create specific rate limiters
export function createRateLimiter(config: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: config.message || 'Too many requests, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Export individual rate limiters for specific use
export { rateLimiters };
