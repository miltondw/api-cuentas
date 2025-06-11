import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Root')
@Controller()
@Public()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root endpoint - API information' })
  @ApiResponse({
    status: 200,
    description: 'API information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'API Ingeocimyc' },
        version: { type: 'string', example: '1.0.0' },
        description: {
          type: 'string',
          example: 'API de Gestión de Proyectos y Servicios INGEOCIMYC',
        },
        environment: { type: 'string', example: 'production' },
        timestamp: { type: 'string', example: '2025-06-09T20:05:33.000Z' },
        status: { type: 'string', example: 'running' },
        docs: { type: 'string', example: '/api-docs' },        endpoints: {
          type: 'object',
          properties: {
            auth: { type: 'string', example: '/api/auth' },
            projects: { type: 'string', example: '/api/projects' },
            serviceRequests: {
              type: 'string',
              example: '/api/service-requests',
            },
            lab: { type: 'string', example: '/api/lab' },
            services: { type: 'string', example: '/api/services' },
            health: { type: 'string', example: '/api/health' },
          },
        },
        config: {
          type: 'object',
          properties: {
            port: { type: 'string', example: '10000' },
            nodeEnv: { type: 'string', example: 'production' },
            renderUrl: { type: 'string', example: 'https://api-cuentas-zlut.onrender.com' },
            isProduction: { type: 'boolean', example: true },
          },
        },
      },
    },
  })  getRoot(): {
    name: string;
    version: string;
    description: string;
    environment: string;
    timestamp: string;
    status: string;
    docs: string;
    endpoints: {
      auth: string;
      projects: string;
      serviceRequests: string;
      lab: string;
      services: string;
      health: string;
    };
    config: {
      port: string;
      nodeEnv: string;
      renderUrl: string;
      isProduction: boolean;
    };
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    const renderUrl = process.env.RENDER_EXTERNAL_URL || 'Not configured';
    
    return {
      name: 'API Ingeocimyc',
      version: process.env.npm_package_version || '1.0.0',
      description: 'API de Gestión de Proyectos y Servicios INGEOCIMYC',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      status: 'running',
      docs: '/api-docs',
      endpoints: {
        auth: '/api/auth',
        projects: '/api/projects',
        serviceRequests: '/api/service-requests',
        lab: '/api/lab',
        services: '/api/services',
        health: '/api/health',
      },
      config: {
        port: process.env.PORT || '5051',
        nodeEnv: process.env.NODE_ENV || 'development',
        renderUrl: renderUrl,
        isProduction: isProduction,
      },
    };
  }

  @Head()
  @ApiOperation({ summary: 'Root endpoint HEAD check for health monitoring' })
  @ApiResponse({
    status: 200,
    description: 'API is running and accessible',
  })
  headRoot(): void {
    // HEAD requests don't return a body, just headers
    // This method exists to handle HEAD requests from health checkers like Render
  }
}
