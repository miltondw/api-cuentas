import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

/**
 * Simple Root Controller for the main API endpoint
 * This controller handles requests to the root path ("/") without the "/api" prefix
 * It's needed for Render's health checks and to prevent 404 errors on the root path
 */
@ApiTags('Root Health')
@Controller() // No path prefix - this handles the root "/"
@Public()
export class SimpleRootController {
  @Get()
  @ApiOperation({ summary: 'Root endpoint - API status' })
  @ApiResponse({
    status: 200,
    description: 'API is running',
  })
  getRoot(): any {
    return {
      message: 'API Ingeocimyc is running',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      endpoints: {
        api: '/api',
        docs: '/api-docs',
        health: '/health',
        info: '/info',
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

  @Get('health')
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({
    status: 200,
    description: 'Health check response',
  })
  getHealth(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    };
  }

  @Head('health')
  @ApiOperation({ summary: 'Health check HEAD request' })
  @ApiResponse({
    status: 200,
    description: 'Health check HEAD response',
  })
  headHealth(): void {
    // HEAD requests don't return a body, just headers
  }

  @Get('info')
  @ApiOperation({ summary: 'API information in JSON format' })
  @ApiResponse({
    status: 200,
    description: 'Detailed API information',
  })
  getInfo(): any {
    return {
      name: 'API Ingeocimyc',
      version: process.env.npm_package_version || '1.0.0',
      description: 'API de Gestión de Proyectos y Servicios INGEOCIMYC',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      status: 'running',
      uptime: process.uptime(),
      endpoints: {
        api: '/api',
        docs: '/api-docs',
        health: '/health',
        root: '/',
        info: '/info',
      },
      company: {
        name: 'INGEOCIMYC',
        fullName:
          'Ingeniería, Geología, Construcción, Investigación, Minería y Consultoría',
        website: 'https://api-cuentas-zlut.onrender.com',
      },
    };
  }
}
