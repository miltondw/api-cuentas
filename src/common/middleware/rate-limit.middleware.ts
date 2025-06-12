import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

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
    skip: req => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/';
    },
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
