import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

/**
 * Root Health Controller
 * This controller handles requests to the root path ("/") without the "/api" prefix
 * It's needed for Render's health checks and to prevent 404 errors on the root path
 */
@Controller() // No path prefix - this handles the root "/"
@Public()
export class RootHealthController {
  @Get()
  getRootHealth(): {
    message: string;
    status: string;
    timestamp: string;
    api: string;
    docs: string;
  } {
    return {
      message: 'API Ingeocimyc is running',
      status: 'ok',
      timestamp: new Date().toISOString(),
      api: '/api',
      docs: '/api-docs',
    };
  }

  @Get('health')
  getHealth(): {
    status: string;
    timestamp: string;
    uptime: number;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
