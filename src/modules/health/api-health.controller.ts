import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('api/health')
@Public()
export class ApiHealthController {
  @Get()
  @ApiOperation({ summary: 'API Health check endpoint for Render' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-06-09T20:05:33.000Z' },
        uptime: { type: 'number', example: 123.456 },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' },
        service: { type: 'string', example: 'api-ingeocimyc' },
      },
    },
  })
  getApiHealth(): {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    service: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'api-ingeocimyc',
    };
  }
}
